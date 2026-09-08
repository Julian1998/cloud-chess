<?php

declare(strict_types=1);

namespace CloudChess\Core\Application;

use CloudChess\Core\Domain\Enum\ColorPreference;
use CloudChess\Core\Domain\Enum\TurnDuration;
use CloudChess\Core\Domain\ValueObject\GameInvitationId;
use CloudChess\Core\Domain\ValueObject\PlayerId;

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
