<?php

declare(strict_types=1);

namespace CloudChess\Core\Ports;

use CloudChess\Core\Domain\Aggregate\GameInvitation;
use CloudChess\Core\Domain\ValueObject\GameInvitationId;
use CloudChess\Core\Domain\ValueObject\PlayerId;
use DateTimeImmutable;

interface GameInvitationRepository
{
    public function get(GameInvitationId $id): GameInvitation;

    public function save(GameInvitation $invitation): void;

    public function hasPending(PlayerId $challenger, PlayerId $opponent, DateTimeImmutable $now): bool;
}
