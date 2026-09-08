<?php

declare(strict_types=1);

namespace CloudChess\Core\Ports;

use CloudChess\Core\Domain\GameInvitation;
use CloudChess\Core\Domain\GameInvitationId;
use CloudChess\Core\Domain\PlayerId;

interface GameInvitationRepository
{
    public function get(GameInvitationId $id): GameInvitation;

    public function save(GameInvitation $invitation): void;

    public function hasPending(PlayerId $challenger, PlayerId $opponent): bool;
}
