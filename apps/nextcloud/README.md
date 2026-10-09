# Nextcloud development adapter

Cloud Chess 0.1.0 runs on the local Nextcloud 34 stack with Nginx, FPM and MariaDB. It supports user search, sent/received invitations and accept/decline through both the React app and native Nextcloud notifications. Accepted invitations create persisted game records with colors and a first deadline. The playable board is still pending.

## First install

Prerequisites: Docker with Compose and GNU Make.

From the repository root:

```bash
cp apps/nextcloud/.env.example apps/nextcloud/.env
make nextcloud-install
```

The copy is only needed when `.env` does not exist. Build commands package the core as a Composer copy, so Nextcloud does not require a workspace symlink. The database schema is installed on app activation. The standard Nextcloud Notifications app must be enabled.

Open <http://localhost:8080/index.php/apps/cloud_chess/> and sign in using the development account configured in `.env`. HTTP is bound to localhost. This stack and its example credentials are for local development.

For iterative development, run `make nextcloud-build` and reload the app page. Vite's manifest supplies hashed asset URLs, so updated JavaScript and CSS do not require enabling Nextcloud debug mode. React source and tests live in `apps/nextcloud/app/frontend/`; PHP classes remain in `lib/`, following Nextcloud's app conventions. Compiled modules and styles live in `js/`.

The generated `js/` directory, including the Vite manifest, is ignored by Git. A fresh checkout requires `make nextcloud-build` before the app can run. `make nextcloud-install` and `make nextcloud-package` include this build automatically; the installable package contains the compiled assets.

## Demo users

The current local instance contains `chess_alice`, `chess_bob` and `chess_carla`, with the local demo password `CloudChess-Demo-2026!`. Use separate browsers/profiles or log out between accounts to exercise invitations.

On a fresh local instance, create these accounts with your own password (existing accounts are left unchanged):

```bash
CLOUD_CHESS_DEMO_PASSWORD='your-local-demo-password' docker compose --env-file apps/nextcloud/.env -f apps/nextcloud/compose.yaml exec -T -u www-data -e CLOUD_CHESS_DEMO_PASSWORD app php custom_apps/cloud_chess/tests/create-demo-users.php
```

## Verification

```bash
make core-test
make core-analyse
make client-check
make nextcloud-test
CLOUD_CHESS_DEMO_PASSWORD='CloudChess-Demo-2026!' make nextcloud-test-http
```

The integration/concurrency tests create and delete dedicated temporary accounts and exercise real database transactions. The PHPUnit HTTP suite uses the demo accounts and changes their invitation history. It checks real session login, CSRF, input validation, actor spoofing, third-user isolation, duplicate invitations and repeated actions. Its Make target installs development dependencies and runs inside the Nextcloud container against Nginx. Do not run these tests against a production instance. Test entry points reject HTTP execution.

`make nextcloud-package` creates `build/cloud_chess.tar.gz`, containing runtime dependencies and compiled assets, excluding frontend sources, Node dependencies, test scripts and nested core development dependencies. Extract the `cloud_chess` directory into a Nextcloud 34 instance's `custom_apps/` and run `occ app:enable cloud_chess` as its web user. App Store publication and compatibility with other Nextcloud versions have not been verified.

## Stack management

```bash
make nextcloud-up
make nextcloud-logs
make nextcloud-down
```

Volumes preserve database and Nextcloud files across container restarts. `docker compose down -v` removes them permanently and is not part of the normal workflow.
