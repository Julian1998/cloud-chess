<?php

declare(strict_types=1);

namespace CloudChess\Core\Tests\Application;

use CloudChess\Core\Domain\Aggregate\GameInvitation;
use CloudChess\Core\Domain\ValueObject\GameInvitationId;
use CloudChess\Core\Domain\ValueObject\PlayerId;
use CloudChess\Core\Ports\GameInvitationRepository;
use DateTimeImmutable;
use RuntimeException;

final class InMemoryGameInvitationRepository implements GameInvitationRepository
{
    /** @var array<string, GameInvitation> */
    private array $invitations = [];

    public function get(GameInvitationId $id): GameInvitation
    {
        return $this->invitations[$id->toString()] ?? throw new RuntimeException('Invitation not found.');
    }

    public function save(GameInvitation $invitation): void
    {
        $this->invitations[$invitation->id()->toString()] = $invitation;
    }

    public function hasPending(PlayerId $challenger, PlayerId $opponent, DateTimeImmutable $now): bool
    {
        foreach ($this->invitations as $invitation) {
            $invitation->expireIfDue($now);

            if (
                $invitation->isPending()
                && $invitation->challengerId()->toString() === $challenger->toString()
                && $invitation->opponentId()->toString() === $opponent->toString()
            ) {
                return true;
            }
        }

        return false;
    }
}
