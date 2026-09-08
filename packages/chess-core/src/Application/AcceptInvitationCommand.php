<?php

declare(strict_types=1);

namespace CloudChess\Core\Application;

use CloudChess\Core\Domain\GameId;
use CloudChess\Core\Domain\GameInvitationId;
use CloudChess\Core\Domain\PlayerId;

final readonly class AcceptInvitationCommand
{
    public function __construct(
        public GameInvitationId $invitationId,
        public PlayerId $actorId,
        public GameId $gameId,
    ) {
    }
}
