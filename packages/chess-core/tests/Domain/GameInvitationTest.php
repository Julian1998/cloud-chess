<?php

declare(strict_types=1);

namespace CloudChess\Core\Tests\Domain;

use CloudChess\Core\Domain\Aggregate\GameInvitation;
use CloudChess\Core\Domain\Enum\ColorPreference;
use CloudChess\Core\Domain\Enum\InvitationStatus;
use CloudChess\Core\Domain\Enum\TurnDuration;
use CloudChess\Core\Domain\Exception\InvitationStateException;
use CloudChess\Core\Domain\ValueObject\GameInvitationId;
use DateTimeImmutable;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class GameInvitationTest extends TestCase
{
    public function test_new_invitation_is_pending_and_expires_after_seven_days(): void
    {
        $invitation = InvitationFixture::pending();

        self::assertSame(InvitationStatus::PENDING, $invitation->status());
        self::assertSame(
            '2026-09-15T10:00:00+00:00',
            $invitation->expiresAt()->format(DATE_ATOM),
        );
    }

    #[DataProvider('persistedStatuses')]
    public function test_restores_persisted_status_and_timestamps(
        InvitationStatus $status,
    ): void {
        $invitation = GameInvitation::restore(
            GameInvitationId::fromString('persisted-invitation'),
            InvitationFixture::challenger(),
            InvitationFixture::opponent(),
            ColorPreference::BLACK,
            TurnDuration::TWO_DAYS,
            new DateTimeImmutable('2026-08-01T09:30:00+00:00'),
            $status,
        );

        self::assertSame($status, $invitation->status());
        self::assertSame(
            '2026-08-01T09:30:00+00:00',
            $invitation->createdAt()->format(DATE_ATOM),
        );
        self::assertSame(
            '2026-08-08T09:30:00+00:00',
            $invitation->expiresAt()->format(DATE_ATOM),
        );
    }

    /** @return array<string, array{InvitationStatus}> */
    public static function persistedStatuses(): array
    {
        return [
            'accepted' => [InvitationStatus::ACCEPTED],
            'declined' => [InvitationStatus::DECLINED],
            'expired' => [InvitationStatus::EXPIRED],
        ];
    }

    public function test_exposes_the_invitation_terms_needed_by_application_use_cases(): void
    {
        $invitation = InvitationFixture::pending();

        self::assertSame('invitation-1', $invitation->id()->toString());
        self::assertSame('challenger', $invitation->challengerId()->toString());
        self::assertSame('opponent', $invitation->opponentId()->toString());
        self::assertSame('random', $invitation->colorPreference()->value);
        self::assertSame('P1D', $invitation->turnDuration()->value);
    }

    public function test_recipient_can_accept_a_pending_invitation(): void
    {
        $invitation = InvitationFixture::pending();

        $invitation->accept(
            InvitationFixture::opponent(),
            new DateTimeImmutable('2026-09-08T12:00:00+00:00'),
        );

        self::assertSame(InvitationStatus::ACCEPTED, $invitation->status());
        self::assertFalse($invitation->isPending());
    }

    public function test_only_recipient_can_accept_an_invitation(): void
    {
        $invitation = InvitationFixture::pending();

        $this->expectException(InvitationStateException::class);
        $invitation->accept(
            InvitationFixture::challenger(),
            new DateTimeImmutable('2026-09-08T12:00:00+00:00'),
        );
    }

    public function test_recipient_can_decline_a_pending_invitation(): void
    {
        $invitation = InvitationFixture::pending();

        $invitation->decline(
            InvitationFixture::opponent(),
            new DateTimeImmutable('2026-09-08T12:00:00+00:00'),
        );

        self::assertSame(InvitationStatus::DECLINED, $invitation->status());
    }

    public function test_only_challenger_can_cancel_an_invitation(): void
    {
        $invitation = InvitationFixture::pending();

        $this->expectException(InvitationStateException::class);
        $invitation->cancel(
            InvitationFixture::opponent(),
            new DateTimeImmutable('2026-09-08T12:00:00+00:00'),
        );
    }

    public function test_challenger_can_cancel_a_pending_invitation(): void
    {
        $invitation = InvitationFixture::pending();

        $invitation->cancel(
            InvitationFixture::challenger(),
            new DateTimeImmutable('2026-09-08T12:00:00+00:00'),
        );

        self::assertSame(InvitationStatus::CANCELLED, $invitation->status());
    }

    public function test_expired_invitation_cannot_be_accepted(): void
    {
        $invitation = InvitationFixture::pending();

        $this->expectException(InvitationStateException::class);
        $invitation->accept(
            InvitationFixture::opponent(),
            new DateTimeImmutable('2026-09-15T10:00:00+00:00'),
        );
    }

    public function test_terminal_invitation_cannot_change_state_again(): void
    {
        $invitation = InvitationFixture::pending();
        $invitation->decline(
            InvitationFixture::opponent(),
            new DateTimeImmutable('2026-09-08T12:00:00+00:00'),
        );

        $this->expectException(InvitationStateException::class);
        $invitation->cancel(
            InvitationFixture::challenger(),
            new DateTimeImmutable('2026-09-08T13:00:00+00:00'),
        );
    }

    public function test_expire_if_due_marks_pending_invitation_as_expired(): void
    {
        $invitation = InvitationFixture::pending();

        $invitation->expireIfDue(
            new DateTimeImmutable('2026-09-15T10:00:00+00:00'),
        );

        self::assertSame(InvitationStatus::EXPIRED, $invitation->status());
    }

    public function test_new_invitation_is_pending(): void
    {
        self::assertTrue(InvitationFixture::pending()->isPending());
    }
}
