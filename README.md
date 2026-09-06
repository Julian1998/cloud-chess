# Cloud Chess

> Open-source correspondence chess for Nextcloud, built on a portable PHP core for future self-hosted platform adapters.

Cloud Chess brings asynchronous PvP and browser-based games against Stockfish to self-hosted collaboration platforms. Nextcloud is the first host; ownCloud Infinite Scale is a later adapter.

## Principles

- One server-authoritative game state per multiplayer game.
- Shared PHP core with Domain, Application, Ports, and the `Presentation/ChessApi` layer.
- Nextcloud provides host integration; storage, notifications, and chess rules are adapters.
- React, TypeScript, Vite, and Tailwind in the client.
- Stockfish WASM runs in a browser Web Worker; the server still validates every move.
- Test-first development and Docker-based tooling.

```text
cloud-chess/
├── packages/chess-core/          # Domain, Application, Ports, Presentation/ChessApi
├── packages/chess-rules-pchess/  # chess-rules adapter
├── apps/nextcloud/               # first platform adapter
├── clients/chess-client/         # React application
└── docs/                         # architecture and decisions
```

## Local development

Run PHP tooling inside Docker:

```bash
docker compose run --rm php composer install
docker compose run --rm php composer test
docker compose run --rm php composer analyse
```

`packages/chess-core` owns `Domain`, `Application`, `Ports`, and the incoming `Presentation/ChessApi` boundary. Concrete platform and technology adapters stay outside the package.

The local Nextcloud FPM, Nginx, MariaDB, and adapter-workspace stack is documented in [apps/nextcloud/README.md](apps/nextcloud/README.md).

## Contributing

The project is in planning; the core is the next implementation milestone. Once public code is available, contributions should be focused and test-first. Keep the Domain, Application, and Ports free of platform imports; API Platform belongs only in `Presentation/ChessApi`. Discuss public API, domain, or dependency changes before starting an implementation.

## Licensing

Licenses are package-specific and decided now:

- `chess-core` and `chess-rules-pchess`: MIT
- Nextcloud adapter: AGPL-3.0-or-later
- Stockfish assets: GPLv3 notices and corresponding-source information included with releases

See [LICENSES.md](LICENSES.md) for the package-level declaration.

## Further reading

- [Architecture and work packages](outputs/2026-09-05-nextcloud-chess-design.md)
- [TDD acceptance criteria](outputs/2026-09-05-chess-tdd-abnahme.md)
