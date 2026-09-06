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
