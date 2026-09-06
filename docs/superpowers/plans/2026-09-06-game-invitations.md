# Game Invitations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Einen testgetriebenen, plattformunabhängigen Core-Slice für Einladungen und die atomare Erzeugung einer Partie implementieren.

**Architecture:** `GameInvitation` und `Game` bleiben getrennte Aggregate im Domain-Layer. Application-Use-Cases koordinieren sie über Ports und eine Transaktionsgrenze. In-Memory-Adapter beweisen den Ablauf, ohne Nextcloud, Datenbank, API Platform oder Schachregeln einzubinden.

**Tech Stack:** PHP 8.3, PHPUnit 12.5, PHPStan 2.2.

**Spec:** `docs/superpowers/specs/2026-09-06-game-invitations-design.md`

## Global Constraints

- Produktionscode liegt ausschließlich unter `packages/chess-core/src/Domain`, `Application` und `Ports`.
- Keine Imports aus Nextcloud, Symfony, API Platform, Datenbankbibliotheken oder `p-chess/chess`.
- `GameInvitation` speichert keine tatsächlichen Farben; nur `Game` besitzt `whitePlayerId` und `blackPlayerId`.
- Zulässige Zugfristen sind ausschließlich ein oder zwei Tage; offene Einladungen laufen nach sieben Tagen ab.
- Jede neue Produktionsmethode erhält zuerst einen fehlenden PHPUnit-Test und anschließend die minimale Implementierung.

---

### Task 1: Identitäten, Konditionen und Zustände

**Files:**
- Create: `packages/chess-core/src/Domain/PlayerId.php`
- Create: `packages/chess-core/src/Domain/GameInvitationId.php`
- Create: `packages/chess-core/src/Domain/GameId.php`
- Create: `packages/chess-core/src/Domain/ColorPreference.php`
- Create: `packages/chess-core/src/Domain/TurnDuration.php`
- Create: `packages/chess-core/src/Domain/InvitationStatus.php`
- Test: `packages/chess-core/tests/Domain/TurnDurationTest.php`
- Test: `packages/chess-core/tests/Domain/ColorPreferenceTest.php`

**Interfaces:**
- Produces: immutable IDs with `fromString(string): self` and `toString(): string`; `TurnDuration::{oneDay(), twoDays()}: self`; enum `ColorPreference { WHITE, BLACK, RANDOM }`; enum `InvitationStatus { PENDING, ACCEPTED, DECLINED, CANCELLED, EXPIRED }`.

- [ ] **Step 1: Failing test for the two allowed turn durations**

```php
public function test_one_day_adds_exactly_one_calendar_day(): void
{
    $now = new DateTimeImmutable('2026-09-06T12:00:00+00:00');

    self::assertSame(
        '2026-09-07T12:00:00+00:00',
        TurnDuration::oneDay()->deadlineFrom($now)->format(DATE_ATOM),
    );
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `docker compose run --rm php ./vendor/bin/phpunit --configuration=phpunit.xml tests/Domain/TurnDurationTest.php`

Expected: FAIL because `TurnDuration` does not exist.

- [ ] **Step 3: Implement the minimal immutable value object**

```php
enum TurnDuration: string
{
    case ONE_DAY = 'P1D';
    case TWO_DAYS = 'P2D';

    public function deadlineFrom(DateTimeImmutable $startedAt): DateTimeImmutable
    {
        return $startedAt->add(new DateInterval($this->value));
    }
}
```

- [ ] **Step 4: Add and verify the two-day and color-preference cases**

Run: `docker compose run --rm php ./vendor/bin/phpunit --configuration=phpunit.xml tests/Domain/TurnDurationTest.php tests/Domain/ColorPreferenceTest.php`

Expected: PASS; `ColorPreference` contains exactly `WHITE`, `BLACK`, and `RANDOM`.

- [ ] **Step 5: Add small immutable ID value objects**

```php
final readonly class PlayerId
{
    public function __construct(private string $value) {}

    public static function fromString(string $value): self { return new self($value); }
    public function toString(): string { return $this->value; }
}
```

Reject an empty string with `InvalidArgumentException`. Use the same shape for game and invitation IDs.

- [ ] **Step 6: Run static analysis and commit**

Run: `make core-test && make core-analyse`

```bash
git add packages/chess-core/src/Domain packages/chess-core/tests/Domain
git commit -m "feat: add invitation domain values"
```

### Task 2: Invitation aggregate lifecycle

**Files:**
- Create: `packages/chess-core/src/Domain/GameInvitation.php`
- Create: `packages/chess-core/src/Domain/InvitationStateException.php`
- Test: `packages/chess-core/tests/Domain/GameInvitationTest.php`

**Interfaces:**
- Consumes: IDs, `ColorPreference`, `TurnDuration`, and `InvitationStatus` from Task 1.
- Produces: `GameInvitation::create(...)`, `accept(PlayerId, DateTimeImmutable)`, `decline(...)`, `cancel(...)`, `expireIfDue(DateTimeImmutable)`, `isPending(): bool` and accessors for its conditions.

- [ ] **Step 1: Failing test for authorized acceptance**

```php
public function test_only_the_opponent_can_accept_a_pending_invitation(): void
{
    $invitation = InvitationFixture::pending();

    $invitation->accept(PlayerId::fromString('opponent'), new DateTimeImmutable('2026-09-07T12:00:00+00:00'));

    self::assertSame(InvitationStatus::ACCEPTED, $invitation->status());
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `docker compose run --rm php ./vendor/bin/phpunit --configuration=phpunit.xml tests/Domain/GameInvitationTest.php`

Expected: FAIL because `GameInvitation` does not exist.

- [ ] **Step 3: Implement creation and acceptance minimally**

`create()` sets `PENDING` and computes `expiresAt` as `createdAt->modify('+7 days')`. `accept()` verifies the actor is `opponentId`, the state is `PENDING`, and `now < expiresAt`; then sets `ACCEPTED`.

- [ ] **Step 4: Add failing tests for decline, cancel, expiration and terminal states**

```php
public function test_challenger_can_cancel_but_opponent_cannot(): void
{
    $invitation = InvitationFixture::pending();
    $invitation->cancel(PlayerId::fromString('challenger'), new DateTimeImmutable('2026-09-06T13:00:00+00:00'));

    self::assertSame(InvitationStatus::CANCELLED, $invitation->status());
}
```

Also assert that accepting after `expiresAt` changes the state to `EXPIRED` and throws `InvitationStateException`, and that no terminal state accepts a second transition.

- [ ] **Step 5: Implement each transition and run the focused test suite**

Run: `docker compose run --rm php ./vendor/bin/phpunit --configuration=phpunit.xml tests/Domain/GameInvitationTest.php`

Expected: PASS.

- [ ] **Step 6: Run full verification and commit**

Run: `make core-test && make core-analyse`

```bash
git add packages/chess-core/src/Domain packages/chess-core/tests/Domain
git commit -m "feat: add invitation lifecycle"
```

### Task 3: Game aggregate and color assignment

**Files:**
- Create: `packages/chess-core/src/Domain/PlayerAssignment.php`
- Create: `packages/chess-core/src/Domain/Game.php`
- Create: `packages/chess-core/src/Ports/ColorAssigner.php`
- Test: `packages/chess-core/tests/Domain/GameTest.php`
- Test: `packages/chess-core/tests/Application/FakeColorAssigner.php`

**Interfaces:**
- Consumes: IDs and `TurnDuration` from Task 1.
- Produces: `PlayerAssignment::withWhiteAndBlack(PlayerId, PlayerId): self`, `Game::start(...)`, and `ColorAssigner::assign(ColorPreference, PlayerId, PlayerId): PlayerAssignment`.

- [ ] **Step 1: Failing test that Game owns actual colors and first deadline**

```php
public function test_game_starts_with_assigned_colors_and_white_deadline(): void
{
    $startedAt = new DateTimeImmutable('2026-09-06T12:00:00+00:00');
    $game = Game::start(
        GameId::fromString('game-1'),
        PlayerAssignment::withWhiteAndBlack(PlayerId::fromString('a'), PlayerId::fromString('b')),
        TurnDuration::TWO_DAYS,
        $startedAt,
    );

    self::assertSame('a', $game->whitePlayerId()->toString());
    self::assertSame('2026-09-08T12:00:00+00:00', $game->turnDeadline()->format(DATE_ATOM));
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `docker compose run --rm php ./vendor/bin/phpunit --configuration=phpunit.xml tests/Domain/GameTest.php`

Expected: FAIL because `Game` does not exist.

- [ ] **Step 3: Implement Game and PlayerAssignment minimally**

Reject equal white and black players in `PlayerAssignment`. `Game` receives already resolved colors and never receives `ColorPreference`.

- [ ] **Step 4: Define the color-assignment port**

```php
interface ColorAssigner
{
    public function assign(
        ColorPreference $preference,
        PlayerId $challenger,
        PlayerId $opponent,
    ): PlayerAssignment;
}
```

- [ ] **Step 5: Verify and commit**

Run: `make core-test && make core-analyse`

```bash
git add packages/chess-core/src/Domain packages/chess-core/src/Ports packages/chess-core/tests
git commit -m "feat: add game creation domain model"
```

### Task 4: Application ports and in-memory adapters

**Files:**
- Create: `packages/chess-core/src/Ports/GameInvitationRepository.php`
- Create: `packages/chess-core/src/Ports/GameRepository.php`
- Create: `packages/chess-core/src/Ports/Clock.php`
- Create: `packages/chess-core/src/Ports/TransactionRunner.php`
- Create: `packages/chess-core/tests/Application/InMemoryGameInvitationRepository.php`
- Create: `packages/chess-core/tests/Application/InMemoryGameRepository.php`
- Create: `packages/chess-core/tests/Application/FrozenClock.php`
- Create: `packages/chess-core/tests/Application/ImmediateTransactionRunner.php`

**Interfaces:**
- Produces: persistence and time contracts owned by the Core, plus test-only adapters.

- [ ] **Step 1: Write a failing test that repository saves and retrieves an invitation**

```php
public function test_repository_retrieves_a_saved_invitation_by_id(): void
{
    $repository = new InMemoryGameInvitationRepository();
    $invitation = InvitationFixture::pending();
    $repository->save($invitation);

    self::assertSame($invitation, $repository->get($invitation->id()));
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `docker compose run --rm php ./vendor/bin/phpunit --configuration=phpunit.xml tests/Application/InMemoryGameInvitationRepositoryTest.php`

Expected: FAIL because the repository contract and adapter do not exist.

- [ ] **Step 3: Define only the required contracts**

```php
interface GameInvitationRepository
{
    public function get(GameInvitationId $id): GameInvitation;
    public function save(GameInvitation $invitation): void;
    public function hasPending(PlayerId $challenger, PlayerId $opponent): bool;
}
```

Define analogous `GameRepository::save(Game $game): void`, `Clock::now(): DateTimeImmutable`, and `TransactionRunner::run(Closure $operation): mixed`.

- [ ] **Step 4: Implement in-memory adapters in tests only**

Use arrays keyed by `toString()`. `FrozenClock` returns its constructor timestamp. `ImmediateTransactionRunner` invokes the closure exactly once.

- [ ] **Step 5: Verify and commit**

Run: `make core-test && make core-analyse`

```bash
git add packages/chess-core/src/Ports packages/chess-core/tests/Application
git commit -m "test: add invitation application adapters"
```

### Task 5: Create- and accept-invitation use cases

**Files:**
- Create: `packages/chess-core/src/Application/CreateInvitation.php`
- Create: `packages/chess-core/src/Application/AcceptInvitation.php`
- Create: `packages/chess-core/src/Application/CreateInvitationCommand.php`
- Create: `packages/chess-core/src/Application/AcceptInvitationCommand.php`
- Create: `packages/chess-core/src/Application/DuplicatePendingInvitation.php`
- Test: `packages/chess-core/tests/Application/CreateInvitationTest.php`
- Test: `packages/chess-core/tests/Application/AcceptInvitationTest.php`

**Interfaces:**
- Consumes: aggregate APIs from Tasks 2–3 and ports from Task 4.
- Produces: an accepted invitation plus a persisted `Game` in one transaction.

- [ ] **Step 1: Write the failing creation test**

```php
public function test_create_invitation_persists_the_selected_conditions(): void
{
    $useCase = ApplicationFixture::createInvitation();

    $invitation = $useCase(new CreateInvitationCommand(
        GameInvitationId::fromString('invite-1'),
        PlayerId::fromString('challenger'),
        PlayerId::fromString('opponent'),
        ColorPreference::RANDOM,
        TurnDuration::ONE_DAY,
    ));

    self::assertSame(InvitationStatus::PENDING, $invitation->status());
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `docker compose run --rm php ./vendor/bin/phpunit --configuration=phpunit.xml tests/Application/CreateInvitationTest.php`

Expected: FAIL because `CreateInvitation` does not exist.

- [ ] **Step 3: Implement creation and the duplicate-pending guard**

`CreateInvitation` reads `Clock`, rejects `hasPending(challenger, opponent)`, creates the aggregate and saves it. It must not create a `Game`.

- [ ] **Step 4: Write the failing acceptance transaction test**

```php
public function test_acceptance_marks_invitation_and_persists_game(): void
{
    $fixture = ApplicationFixture::withPendingInvitation();

    $game = $fixture->acceptInvitation(new AcceptInvitationCommand(
        GameInvitationId::fromString('invite-1'),
        PlayerId::fromString('opponent'),
        GameId::fromString('game-1'),
    ));

    self::assertSame(InvitationStatus::ACCEPTED, $fixture->invitation()->status());
    self::assertSame('game-1', $game->id()->toString());
}
```

- [ ] **Step 5: Implement acceptance inside TransactionRunner**

Within `run()`: load invitation, call `accept()`, use `ColorAssigner`, create `Game`, save invitation and game, then return game. Test that an expired invitation persists no game.

- [ ] **Step 6: Run full verification and commit**

Run: `make core-test && make core-analyse`

```bash
git add packages/chess-core/src/Application packages/chess-core/tests/Application
git commit -m "feat: add invitation application flow"
```
