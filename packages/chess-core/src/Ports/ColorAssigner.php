<?php

declare(strict_types=1);

namespace CloudChess\Core\Ports;

use CloudChess\Core\Domain\Enum\ColorPreference;
use CloudChess\Core\Domain\ValueObject\PlayerAssignment;
use CloudChess\Core\Domain\ValueObject\PlayerId;

interface ColorAssigner
{
    public function assign(
        ColorPreference $preference,
        PlayerId $challenger,
        PlayerId $opponent,
    ): PlayerAssignment;
}
