# Architecture

## Package boundaries

`packages/chess-core` is a portable PHP library with three layers:

- `Domain`: invitation and game aggregates, value objects, enums and invariants.
- `Application`: create, accept and decline use cases.
- `Ports`: repository, transaction, clock and color-assignment contracts.

Concrete persistence, user discovery and notification adapters live in `apps/nextcloud/app`. The React/TypeScript frontend belongs to the Nextcloud app: `apps/nextcloud/app/src` contains its source, and Vite builds hashed JavaScript/CSS assets into the app-local `js` directory. The Nextcloud page loads their URLs from Vite's build manifest. `main.tsx` mounts a BrowserRouter with the host-provided base path. `App.tsx` supplies the error boundary and Suspense around the route tree. The invitation page composes focused components; hooks own invitation loading/mutations and user search. The invitation page is loaded as a separate JavaScript module.

```text
Browser -- HTTP --> Nextcloud controller -- PHP call --> chess-core use case
```

Nextcloud calls the core directly in the same PHP process. Neither package uses API Platform. A separate HTTP API is deferred until a concrete consumer needs it. The empty `Presentation/ChessApi` bootstrap placeholder is not an active architecture layer.

## Invitations and games

`GameInvitation` and `Game` are separate aggregates. An invitation records challenger, opponent, preferred color, turn duration, status, creation time and expiration time. It expires seven days after creation.

```text
pending
  |-- opponent accepts --> accepted
  |-- opponent declines -> declined
  |-- challenger cancels -> cancelled
  `-- reaches expiry ----> expired
```

Only pending invitations can change. Cancellation exists in the domain without an application endpoint or UI. Only the opponent can accept or decline; unrelated users cannot read or modify the invitation. One pending invitation per ordered player pair is allowed. Turn duration is `P1D` or `P2D`.

Acceptance assigns colors once on the server and creates a game with its first deadline. Game IDs equal their originating invitation IDs. Persisted timestamps, colors and deadlines are restored rather than recomputed. Game summaries are implemented; playable moves and chess rules are still pending.

## Persistence and concurrency

Nextcloud migrations create `cc_invitations`, `cc_games` and `cc_pair_locks`. A hash of the ordered player pair identifies a lock row. Creation and response operations acquire a write lock before checking or transitioning invitation state.

Acceptance saves the invitation and game in one transaction. The game primary key enforces one game per invitation. A failed write rolls back both records; duplicate or repeated transitions return a conflict. Expired invitations do not prevent a new invitation.

## Authentication and endpoints

Controllers obtain actor identity from the Nextcloud session. Mutations retain Nextcloud CSRF checks. User discovery uses Nextcloud's collaborator search and honors host visibility restrictions. Creation revalidates the selected user using the original search term.

- `GET /`: application page.
- `GET /api/users?search=...`: bounded user search.
- `GET /api/invitations`: actor-scoped received and sent invitations, including accepted game summaries.
- `POST /api/invitations`: create an invitation.
- `POST /api/invitations/{id}/accept`: opponent-only acceptance.
- `POST /api/invitations/{id}/decline`: opponent-only decline.

Malformed input returns 400, inaccessible invitations return 404, and duplicates or invalid state transitions return 409. Internal exceptions are logged rather than exposed to the client.

## Notification semantics

The app list and native Nextcloud notifications refer to the same invitation state. Both accept/decline surfaces call the same authenticated endpoints and core use cases. Dismissing a notification does not decline an invitation.

Notifications are published only after commit, with absolute POST action links. Resolution marks the matching recipient's notification processed. Preparation rejects obsolete, expired or wrong-recipient notifications. Notification failures are logged and returned as warnings without undoing committed invitation state. Durable retries are not implemented.

## Client and packaging

The app refreshes after its own actions and offers manual refresh. Request sequencing prevents older list responses from overwriting newer results. Automatic synchronization across tabs is not implemented.

The distributable contains compiled assets, the copied Composer core dependency and license text. It excludes local integration scripts and nested core development dependencies and does not depend on workspace symlinks. Test PHP scripts reject HTTP execution before bootstrapping Nextcloud.

See [current status](status.md) for verification evidence and [local setup](../apps/nextcloud/README.md) for installation and testing.
