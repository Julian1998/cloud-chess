<?php

declare(strict_types=1);

namespace OCA\Chess\Service;

use CloudChess\Core\Domain\Enum\ColorPreference;
use CloudChess\Core\Domain\ValueObject\PlayerAssignment;
use CloudChess\Core\Domain\ValueObject\PlayerId;
use CloudChess\Core\Ports\ColorAssigner as ColorAssignerPort;

use function random_int;

final class ColorAssigner implements ColorAssignerPort
{
    public function assign(ColorPreference $preference, PlayerId $challenger, PlayerId $opponent): PlayerAssignment
    {
        $challengerWhite = match ($preference) {
            ColorPreference::WHITE => true,
            ColorPreference::BLACK => false,
            ColorPreference::RANDOM => random_int(0, 1) === 1,
        };

        return $challengerWhite
            ? PlayerAssignment::withWhiteAndBlack($challenger, $opponent)
            : PlayerAssignment::withWhiteAndBlack($opponent, $challenger);
    }
}
