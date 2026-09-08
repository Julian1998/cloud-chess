<?php

declare(strict_types=1);

namespace CloudChess\Core\Tests\Application;

use CloudChess\Core\Application\AcceptInvitation;
use CloudChess\Core\Application\AcceptInvitationCommand;
use CloudChess\Core\Domain\GameId;
use CloudChess\Core\Domain\InvitationStateException;
use CloudChess\Core\Domain\InvitationStatus;
use CloudChess\Core\Domain\PlayerAssignment;
use CloudChess\Core\Domain\PlayerId;
use CloudChess\Core\Tests\Domain\InvitationFixture;
use DateTimeImmutable;
use PHPUnit\Framework\TestCase;

final class AcceptInvitationTest extends TestCase
{
    public function test_acceptance_marks_invitation_and_persists_a_game(): void
    {
        $invitations = new InMemoryGameInvitationRepository();
        $invitation = InvitationFixture::pending();
        $invitations->save($invitation);
        $games = new InMemoryGameRepository();
        $useCase = new AcceptInvitation(
            $invitations,
            $games,
            new FakeColorAssigner(PlayerAssignment::withWhiteAndBlack(InvitationFixture::challenger(), InvitationFixture::opponent())),
            new FrozenClock(new DateTimeImmutable('2026-09-08T12:00:00+00:00')),
            new ImmediateTransactionRunner(),
        );

        $game = $useCase(new AcceptInvitationCommand(
            $invitation->id(),
            InvitationFixture::opponent(),
            GameId::fromString('game-1'),
        ));

        self::assertSame(InvitationStatus::ACCEPTED, $invitation->status());
        self::assertSame($game, $games->get(GameId::fromString('game-1')));
        self::assertSame('challenger', $game->whitePlayerId()->toString());
        self::assertSame('opponent', $game->blackPlayerId()->toString());
        self::assertSame('2026-09-09T12:00:00+00:00', $game->turnDeadline()->format(DATE_ATOM));
    }

    public function test_expired_invitation_persists_no_game(): void
    {
        $invitations = new InMemoryGameInvitationRepository();
        $invitation = InvitationFixture::pending();
        $invitations->save($invitation);
        $games = new InMemoryGameRepository();
        $useCase = new AcceptInvitation(
            $invitations,
            $games,
            new FakeColorAssigner(PlayerAssignment::withWhiteAndBlack(InvitationFixture::challenger(), InvitationFixture::opponent())),
            new FrozenClock(new DateTimeImmutable('2026-09-15T10:00:00+00:00')),
            new ImmediateTransactionRunner(),
        );

        $this->expectException(InvitationStateException::class);

        try {
            $useCase(new AcceptInvitationCommand(
                $invitation->id(),
                InvitationFixture::opponent(),
                GameId::fromString('game-1'),
            ));
        } finally {
            self::assertSame(InvitationStatus::EXPIRED, $invitation->status());
            self::assertFalse($games->has(GameId::fromString('game-1')));
        }
    }
}
