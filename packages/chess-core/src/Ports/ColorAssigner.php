<?php

declare(strict_types=1);

namespace CloudChess\Core\Ports;

use CloudChess\Core\Domain\ColorPreference;
use CloudChess\Core\Domain\PlayerAssignment;
use CloudChess\Core\Domain\PlayerId;

interface ColorAssigner
{
    public function assign(
        ColorPreference $preference,
        PlayerId $challenger,
        PlayerId $opponent,
    ): PlayerAssignment;
}
