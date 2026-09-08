<?php

declare(strict_types=1);

namespace CloudChess\Core\Domain\Aggregate;

use DateInterval;
use DateTimeImmutable;
use CloudChess\Core\Domain\Enum\ColorPreference;
use CloudChess\Core\Domain\Enum\InvitationStatus;
use CloudChess\Core\Domain\Enum\TurnDuration;
use CloudChess\Core\Domain\Exception\InvitationStateException;
use CloudChess\Core\Domain\ValueObject\GameInvitationId;
use CloudChess\Core\Domain\ValueObject\PlayerId;

final class GameInvitation
{
    private InvitationStatus $status;
    private readonly DateTimeImmutable $expiresAt;

    private function __construct(
        private readonly GameInvitationId $id,
        private readonly PlayerId $challengerId,
        private readonly PlayerId $opponentId,
        private readonly ColorPreference $colorPreference,
        private readonly TurnDuration $turnDuration,
        private readonly DateTimeImmutable $createdAt,
    ) {
        $this->status = InvitationStatus::PENDING;
        $this->expiresAt = $createdAt->add(new DateInterval('P7D'));
    }

    public static function create(
        GameInvitationId $id,
        PlayerId $challengerId,
        PlayerId $opponentId,
        ColorPreference $colorPreference,
        TurnDuration $turnDuration,
        DateTimeImmutable $createdAt,
    ): self {
        if ($challengerId->toString() === $opponentId->toString()) {
            throw new InvitationStateException('Challenger and opponent must differ.');
        }

        return new self($id, $challengerId, $opponentId, $colorPreference, $turnDuration, $createdAt);
    }

    public function accept(PlayerId $actor, DateTimeImmutable $now): void
    {
        $this->ensurePending($now);

        if ($actor->toString() !== $this->opponentId->toString()) {
            throw new InvitationStateException('Only the opponent can accept an invitation.');
        }

        $this->status = InvitationStatus::ACCEPTED;
    }

    public function decline(PlayerId $actor, DateTimeImmutable $now): void
    {
        $this->ensurePending($now);

        if ($actor->toString() !== $this->opponentId->toString()) {
            throw new InvitationStateException('Only the opponent can decline an invitation.');
        }

        $this->status = InvitationStatus::DECLINED;
    }

    public function cancel(PlayerId $actor, DateTimeImmutable $now): void
    {
        $this->ensurePending($now);

        if ($actor->toString() !== $this->challengerId->toString()) {
            throw new InvitationStateException('Only the challenger can cancel an invitation.');
        }

        $this->status = InvitationStatus::CANCELLED;
    }

    public function expireIfDue(DateTimeImmutable $now): void
    {
        if ($this->status === InvitationStatus::PENDING && $now >= $this->expiresAt) {
            $this->status = InvitationStatus::EXPIRED;
        }
    }

    public function status(): InvitationStatus
    {
        return $this->status;
    }

    public function isPending(): bool
    {
        return $this->status === InvitationStatus::PENDING;
    }

    public function expiresAt(): DateTimeImmutable
    {
        return $this->expiresAt;
    }

    public function id(): GameInvitationId
    {
        return $this->id;
    }

    public function challengerId(): PlayerId
    {
        return $this->challengerId;
    }

    public function opponentId(): PlayerId
    {
        return $this->opponentId;
    }

    public function colorPreference(): ColorPreference
    {
        return $this->colorPreference;
    }

    public function turnDuration(): TurnDuration
    {
        return $this->turnDuration;
    }

    private function ensurePending(DateTimeImmutable $now): void
    {
        $this->expireIfDue($now);

        if ($this->status !== InvitationStatus::PENDING) {
            throw new InvitationStateException('Only pending invitations can change state.');
        }
    }
}
