# Cloud Chess

> Open-source correspondence chess for Nextcloud, built on a portable PHP core for future self-hosted platform adapters.

Cloud Chess brings asynchronous PvP and browser-based games against Stockfish to self-hosted collaboration platforms. Nextcloud is the first host; ownCloud Infinite Scale is a later adapter.

## Principles

- One server-authoritative game state per multiplayer game.
- Shared PHP core with Domain, Application and Ports; platform adapters call its use cases directly in PHP.
- No API Platform or separate HTTP API package is planned for the current scope.
- Nextcloud provides host integration; storage, notifications, and chess rules are adapters.
- React, TypeScript, and Vite for the frontend inside the Nextcloud app.
- Stockfish WASM runs in a browser Web Worker; the server still validates every move.
- Test-first development and Docker-based tooling.

```text
cloud-chess/
├── packages/chess-core/          # Domain, Application, Ports
├── packages/chess-rules-pchess/  # chess-rules adapter
├── apps/nextcloud/               # PHP adapter and React frontend
└── docs/                         # architecture and decisions
```

## Local development

Run PHP tooling inside Docker:

```bash
docker compose run --rm php composer install
docker compose run --rm php composer test
docker compose run --rm php composer analyse
```

`packages/chess-core` owns `Domain`, `Application` and `Ports`. Nextcloud controllers call core use cases directly in-process; there is no HTTP connection between Nextcloud and the core. Concrete platform and technology adapters stay outside the package. A separate HTTP API package is deferred unless a concrete consumer requires it.

Build and install the local Nextcloud app with `make nextcloud-install` after creating `apps/nextcloud/.env` from its example. Open <http://localhost:8080/index.php/apps/cloud_chess/>. Run `make nextcloud-test` for database/notification integration and concurrency checks, and `make client-check` for frontend checks.

The local Nextcloud FPM, Nginx, MariaDB, and adapter-workspace stack is documented in [apps/nextcloud/README.md](apps/nextcloud/README.md).

Use `make format` to format PHP, TypeScript and CSS; `make format-check` verifies the style without changing files. PHP uses PSR-12 through PHP CS Fixer, and the client uses Prettier. Install core development dependencies first with `make core-install`.

## Contributing

The first Nextcloud milestone is implemented: multiple users can send invitations and accept or decline them in Cloud Chess or through native Nextcloud notifications. Invitations and newly created game records persist in the database. A playable chessboard is the next milestone. Contributions should be focused and test-first. Keep the Domain, Application, and Ports free of platform imports; Neither `chess-core` nor the Nextcloud adapter uses API Platform; introducing a separate API package requires a concrete use case. Discuss public API, domain, or dependency changes before starting an implementation.

## Licensing

Licenses are package-specific and decided now:

- `chess-core` and `chess-rules-pchess`: MIT
- Nextcloud adapter: AGPL-3.0-or-later
- Stockfish assets: GPLv3 notices and corresponding-source information included with releases

See [LICENSES.md](LICENSES.md) for the package-level declaration.

## Further reading

- [Current implementation status](docs/status.md)
- [Architecture](docs/architecture.md)

The original architecture and TDD acceptance documents referenced under `outputs/` are not present in this checkout.
