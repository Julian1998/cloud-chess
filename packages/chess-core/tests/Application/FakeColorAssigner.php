<?php

declare(strict_types=1);

namespace CloudChess\Core\Tests\Application;

use CloudChess\Core\Domain\ColorPreference;
use CloudChess\Core\Domain\PlayerAssignment;
use CloudChess\Core\Domain\PlayerId;
use CloudChess\Core\Ports\ColorAssigner;

final readonly class FakeColorAssigner implements ColorAssigner
{
    public function __construct(private PlayerAssignment $assignment)
    {
    }

    public function assign(ColorPreference $preference, PlayerId $challenger, PlayerId $opponent): PlayerAssignment
    {
        return $this->assignment;
    }
}
