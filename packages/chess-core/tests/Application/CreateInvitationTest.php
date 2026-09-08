<?php

declare(strict_types=1);

namespace CloudChess\Core\Tests\Application;

use CloudChess\Core\Application\CreateInvitation;
use CloudChess\Core\Application\CreateInvitationCommand;
use CloudChess\Core\Application\DuplicatePendingInvitation;
use CloudChess\Core\Domain\ColorPreference;
use CloudChess\Core\Domain\GameInvitationId;
use CloudChess\Core\Domain\InvitationStatus;
use CloudChess\Core\Domain\PlayerId;
use CloudChess\Core\Domain\TurnDuration;
use DateTimeImmutable;
use PHPUnit\Framework\TestCase;

final class CreateInvitationTest extends TestCase
{
    public function test_persists_the_selected_invitation_conditions(): void
    {
        $repository = new InMemoryGameInvitationRepository();
        $useCase = new CreateInvitation($repository, new FrozenClock(new DateTimeImmutable('2026-09-08T10:00:00+00:00')));

        $invitation = $useCase(new CreateInvitationCommand(
            GameInvitationId::fromString('invite-1'),
            PlayerId::fromString('challenger'),
            PlayerId::fromString('opponent'),
            ColorPreference::RANDOM,
            TurnDuration::ONE_DAY,
        ));

        self::assertSame(InvitationStatus::PENDING, $invitation->status());
        self::assertSame($invitation, $repository->get(GameInvitationId::fromString('invite-1')));
    }

    public function test_rejects_a_second_pending_invitation_in_the_same_direction(): void
    {
        $repository = new InMemoryGameInvitationRepository();
        $useCase = new CreateInvitation($repository, new FrozenClock(new DateTimeImmutable('2026-09-08T10:00:00+00:00')));
        $command = new CreateInvitationCommand(
            GameInvitationId::fromString('invite-1'),
            PlayerId::fromString('challenger'),
            PlayerId::fromString('opponent'),
            ColorPreference::RANDOM,
            TurnDuration::ONE_DAY,
        );
        $useCase($command);

        $this->expectException(DuplicatePendingInvitation::class);
        $useCase(new CreateInvitationCommand(
            GameInvitationId::fromString('invite-2'),
            PlayerId::fromString('challenger'),
            PlayerId::fromString('opponent'),
            ColorPreference::WHITE,
            TurnDuration::TWO_DAYS,
        ));
    }

    public function test_allows_a_new_invitation_after_an_existing_one_has_expired(): void
    {
        $repository = new InMemoryGameInvitationRepository();
        $repository->save(\CloudChess\Core\Tests\Domain\InvitationFixture::pending());
        $useCase = new CreateInvitation($repository, new FrozenClock(new DateTimeImmutable('2026-09-15T10:00:00+00:00')));

        $invitation = $useCase(new CreateInvitationCommand(
            GameInvitationId::fromString('invite-2'),
            PlayerId::fromString('challenger'),
            PlayerId::fromString('opponent'),
            ColorPreference::BLACK,
            TurnDuration::TWO_DAYS,
        ));

        self::assertSame('invite-2', $invitation->id()->toString());
    }
}
