<?php

declare(strict_types=1);

namespace CloudChess\Core\Application;

use CloudChess\Core\Domain\ValueObject\GameId;
use CloudChess\Core\Domain\ValueObject\GameInvitationId;
use CloudChess\Core\Domain\ValueObject\PlayerId;

final readonly class AcceptInvitationCommand
{
    public function __construct(
        public GameInvitationId $invitationId,
        public PlayerId $actorId,
        public GameId $gameId,
    ) {
    }
}
