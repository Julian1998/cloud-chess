# Current implementation status

Verified on 2026-10-09, continuing the implementation begun on 2026-09-12.

## Working milestone

Cloud Chess 0.1.0 is enabled in the local Nextcloud 34.0.4 instance. Signed-in users can search permitted Nextcloud users, send invitations, view sent/received lists, and accept or decline from both the app and native Nextcloud notifications. Both action surfaces call the same application use cases. Invitation and game records persist in MariaDB.

The core includes create, accept and decline use cases, invitation restoration and creation timestamps. Domain cancellation remains available without a cancellation UI. Nextcloud adapters supply repositories, transactions, clock and server-side color assignment. Accepted game IDs equal the originating invitation IDs, enforcing one game per invitation through the game primary key. Pair locks serialize creation and response operations.

Notifications are published after commit and removed after resolution. Obsolete/expired notices are invalidated during preparation. Dismissing a notice does not decline an invitation. Notification-service failures are logged and returned as warnings without undoing the committed invitation state. Durable notification retries remain outside this milestone.

## Verification evidence

- Core: 35 PHPUnit tests, 62 assertions; PHPStan checks 38 files without errors.
- Client: four focused tests; TypeScript check and Vite production build pass; npm audit reports zero vulnerabilities in the locked dependencies.
- Real Nextcloud/MariaDB integration: creation, listing, duplicate rejection, third-user isolation, acceptance/replay, decline, restoration, forced rollback, expiry, restricted user discovery and notification persistence/removal.
- Concurrent create and accept requests each commit once; the competing request receives a conflict.
- HTTP checks: real login, CSRF rejection, invalid inputs, actor spoofing rejection, foreign-user denial, duplicate/replayed actions.
- Browser checks: sending through the app, acceptance and decline through native notifications, acceptance and decline inside Cloud Chess; resolved state and game summary persist after refreshing. Previously stored September records survived the container restart in October.
- Test scripts have CLI-only guards and are excluded from the distributable app archive.

## Confirmed architecture

`chess-core` owns Domain, Application and Ports. Nextcloud controllers call its PHP use cases directly. The browser uses Nextcloud HTTP endpoints. There is no HTTP hop between Nextcloud and the core and no API Platform dependency. A separate `chess-core-api` is deferred until a concrete consumer needs it.

The existing empty `packages/chess-core/src/Presentation/ChessApi/.gitkeep` remains a historical bootstrap artifact. The original architecture and acceptance documents under `outputs/` are absent from this checkout.

## Remaining scope

Playable chessboard, moves, rule validation, Stockfish, invitation cancellation UI and background jobs are not implemented. Game summaries record the initial deadline; they do not implement a playable timed game yet. Automatic live synchronization between open tabs is not implemented; refresh loads the authoritative state.

The local stack is development infrastructure. Other Nextcloud versions, App Store publication, native mobile/push delivery and production operations have not been verified. See [local setup](../apps/nextcloud/README.md) and [architecture](architecture.md).
