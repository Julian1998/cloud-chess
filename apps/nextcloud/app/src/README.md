# Frontend component structure

The Vue frontend follows Atomic Design. Nextcloud Vue components are treated as
atoms and imported directly wherever needed; do not wrap them just to rename or
forward their props.

| Layer | Responsibility | Examples |
| --- | --- | --- |
| `components/atoms` | App-specific visual primitives | `AppIcon` |
| `components/molecules` | Small UI units with typed props and events | Invitation rows, response controls, tabs, player search |
| `components/organisms` | Complete sections composed from atoms and molecules | Navigation, invitation list/detail/form, settings dialog |
| `templates` | Page layout and placement of content through slots | `PageTemplate` |
| `pages` | Connect the template and organisms to application state and actions | `InvitationsPage` |
| `stores` | Shared Pinia state, server records and data actions | `useInvitationsStore`, `useGamesStore`, `useNavigationStore` |
| `composables` | Small component lifecycle and UI helpers | `useServerPolling`, `useNavigation`, `useUserSearch` |
| `types` | Shared data, component props/events and navigation contracts | `invitations.ts`, `components.ts`, `navigation.ts` |
| `lib` | Pure presentation helpers | Invitation grouping and labels |

Children receive data through props/models and expose user intent through typed
events. Pinia stores own shared state and data actions. `AppShell` configures the API
client once; pages and navigation consume the domain stores with `storeToRefs()`.
Player search and form draft state remain local to their components.

Component-specific styles live in their owning Vue file. Nextcloud internals are
styled under app-specific `chess-` selectors; these styles are intentionally unscoped
to retain the native components' markup and teleported dialog styling. `style.css`
only contains the application root and shared shell layout. Use Nextcloud CSS
variables for colors, including light and dark themes.

Run `pnpm test`, `pnpm run typecheck`, `pnpm run build` and
`pnpm run format:check` from the app directory. The integration tests cover the
page through its real app components, including API responses, dialogs, sidebar
actions, mobile navigation and stored preferences.


## App layout

`App.vue` renders a persistent `AppShell`. The shell owns `SidebarNavigation`,
`NcAppContent`, `AppSettingsDialog` and the new-invitation dialog. Its default slot
places the current page inside `NcAppContent`. Pages and templates must not render
another navigation or `NcAppContent` container.

Shared structural components use domain-neutral names (`AppShell`,
`SidebarNavigation`, `AppIcon`, `PageTemplate`). Invitation-specific components
retain their domain names.


## Translations

UI code calls `translate(text, params?)` from `platform/i18n.ts`. That module
connects the frontend to Nextcloud's translation catalog and owns the translation
domain. Keep platform-specific translation imports out of components. The catalog
registration in `test-setup.ts` and `l10n/de.js` still uses the installed app ID.
Translation extraction tooling must recognize `translate` with its first argument
as the message (for xgettext: `--keyword=translate:1`).


## Server state and polling

Each domain is a separate Pinia setup store, with one file per store:

- `invitations.ts`: server invitation records, received/sent/history getters, request state and create/respond/refresh actions.
- `games.ts`: game summaries derived reactively from the API's embedded invitation records; no duplicate server state or separate requests.
- `navigation.ts`: shared selection, active view, dialog state and per-user sidebar preferences. It composes the invitation and game stores without circular dependencies.

There is no root store or nested module registration. Components import the stores they use and preserve reactivity with `storeToRefs()`.
All reactive state is returned from setup stores. API clients and in-flight request bookkeeping remain private, non-reactive runtime values.
Actions return API results; the caller handles toast feedback, dialog closing and navigation.
Page headings and success messages are derived in the page, not the store.
`useServerPolling` runs only in `AppShell`: one initial load, then a refresh every
20 seconds, stopped on unmount. Requests are coalesced; polling pauses during
mutations, and old responses are invalidated before a mutation or on unmount.
Background failures preserve records and action errors and expose `syncError`.

The current invitation endpoint also returns accepted-game summaries. There is no
move endpoint yet; add its synchronization to this central polling lifecycle when
that API exists. API clients, promises and timers are kept outside Pinia's reactive
state. Server records are not persisted to localStorage. Future local bot games can add serializable state with per-user, versioned persistence,
independent of server polling. No bot-game persistence is implemented yet.

Dates use Nextcloud Vue’s `useFormatTime` through a small ISO-date adapter; the adapter preserves the fallback for invalid dates.
