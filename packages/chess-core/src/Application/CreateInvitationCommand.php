<?php

declare(strict_types=1);

namespace CloudChess\Core\Application;

use CloudChess\Core\Domain\ColorPreference;
use CloudChess\Core\Domain\GameInvitationId;
use CloudChess\Core\Domain\PlayerId;
use CloudChess\Core\Domain\TurnDuration;

final readonly class CreateInvitationCommand
{
    public function __construct(
        public GameInvitationId $id,
        public PlayerId $challengerId,
        public PlayerId $opponentId,
        public ColorPreference $colorPreference,
        public TurnDuration $turnDuration,
    ) {
    }
}
