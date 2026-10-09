NEXTCLOUD_COMPOSE := docker compose --env-file apps/nextcloud/.env -f apps/nextcloud/compose.yaml

.PHONY: core-install core-test core-analyse nextcloud-up nextcloud-down nextcloud-recreate nextcloud-logs

core-install:
	docker compose run --rm php composer install

core-test:
	docker compose run --rm php composer test

core-analyse:
	docker compose run --rm php composer analyse

nextcloud-up:
	$(NEXTCLOUD_COMPOSE) up -d

nextcloud-down:
	$(NEXTCLOUD_COMPOSE) down

nextcloud-recreate:
	$(NEXTCLOUD_COMPOSE) down
	$(NEXTCLOUD_COMPOSE) up -d

nextcloud-logs:
	$(NEXTCLOUD_COMPOSE) logs -f app web db

.PHONY: client-build client-check nextcloud-build nextcloud-install nextcloud-test nextcloud-test-http nextcloud-package

client-build:
	docker run --rm -v "$(CURDIR):/app" -w /app/apps/nextcloud/app node:24-alpine sh -c 'npm ci && npm run typecheck && npm run build'

client-check:
	docker run --rm -v "$(CURDIR):/app" -w /app/apps/nextcloud/app node:24-alpine sh -c 'npm ci && npm test && npm run typecheck && npm run build'

nextcloud-build: client-build
	$(NEXTCLOUD_COMPOSE) run --rm --no-deps workspace composer install --no-dev --no-interaction
	$(NEXTCLOUD_COMPOSE) run --rm --no-deps workspace composer reinstall cloud-chess/chess-core --no-interaction

nextcloud-install: nextcloud-up nextcloud-build
	$(NEXTCLOUD_COMPOSE) exec -T -u www-data app php occ app:enable cloud_chess

nextcloud-test:
	$(NEXTCLOUD_COMPOSE) exec -T -u www-data app php custom_apps/cloud_chess/tests/integration.php
	$(NEXTCLOUD_COMPOSE) exec -T -u www-data app php custom_apps/cloud_chess/tests/concurrency.php

nextcloud-test-http:
	$(NEXTCLOUD_COMPOSE) run --rm --no-deps workspace composer install --no-interaction
	$(NEXTCLOUD_COMPOSE) exec -T -u www-data -e CLOUD_CHESS_DEMO_PASSWORD -e CLOUD_CHESS_HTTP_CONNECT_TO=localhost:8080:web:80 app php custom_apps/cloud_chess/vendor/bin/phpunit --configuration custom_apps/cloud_chess/tests/phpunit-http.xml

nextcloud-package: nextcloud-build
	mkdir -p build
	tar --exclude='./src' --exclude='./node_modules' --exclude='./package.json' --exclude='./package-lock.json' --exclude='./tsconfig.json' --exclude='./vite.config.ts' --exclude='./tests' --exclude='./vendor/cloud-chess/chess-core/vendor' --exclude='./vendor/cloud-chess/chess-core/tests' --exclude='./vendor/cloud-chess/chess-core/.phpunit*' --exclude='./.gitkeep' --exclude='./.gitignore' --transform='s,^\.,cloud_chess,' -czf build/cloud_chess.tar.gz -C apps/nextcloud/app .

.PHONY: format format-check

format:
	docker compose run --rm php composer format
	docker run --rm -v "$(CURDIR):/app" -w /app/apps/nextcloud/app node:24-alpine sh -c 'npm ci && npm run format'

format-check:
	docker compose run --rm php composer format:check
	docker run --rm -v "$(CURDIR):/app" -w /app/apps/nextcloud/app node:24-alpine sh -c 'npm ci && npm run format:check'
