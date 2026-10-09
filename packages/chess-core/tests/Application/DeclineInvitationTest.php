<?php

declare(strict_types=1);

namespace CloudChess\Core\Tests\Application;

use CloudChess\Core\Application\DeclineInvitation;
use CloudChess\Core\Application\DeclineInvitationCommand;
use CloudChess\Core\Domain\Enum\InvitationStatus;
use CloudChess\Core\Domain\Exception\InvitationStateException;
use CloudChess\Core\Tests\Domain\InvitationFixture;
use DateTimeImmutable;
use PHPUnit\Framework\TestCase;

final class DeclineInvitationTest extends TestCase
{
    public function test_opponent_declines_and_persists_invitation_inside_transaction(): void
    {
        $invitations = new InMemoryGameInvitationRepository();
        $invitation = InvitationFixture::pending();
        $invitations->save($invitation);
        $transactions = new ImmediateTransactionRunner();
        $useCase = new DeclineInvitation(
            $invitations,
            new FrozenClock(new DateTimeImmutable('2026-09-08T12:00:00+00:00')),
            $transactions,
        );

        $result = $useCase(
            new DeclineInvitationCommand(
                $invitation->id(),
                InvitationFixture::opponent(),
            ),
        );

        self::assertSame($invitation, $result);
        self::assertSame(
            InvitationStatus::DECLINED,
            $invitations->get($invitation->id())->status(),
        );
        self::assertSame(1, $transactions->runCount);
    }

    public function test_only_opponent_can_decline(): void
    {
        $invitations = new InMemoryGameInvitationRepository();
        $invitation = InvitationFixture::pending();
        $invitations->save($invitation);
        $useCase = new DeclineInvitation(
            $invitations,
            new FrozenClock(new DateTimeImmutable('2026-09-08T12:00:00+00:00')),
            new ImmediateTransactionRunner(),
        );

        $this->expectException(InvitationStateException::class);
        $useCase(
            new DeclineInvitationCommand(
                $invitation->id(),
                InvitationFixture::challenger(),
            ),
        );
    }
}
