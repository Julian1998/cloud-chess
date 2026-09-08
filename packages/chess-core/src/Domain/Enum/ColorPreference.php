<?php

declare(strict_types=1);

namespace CloudChess\Core\Domain\Enum;

enum ColorPreference: string
{
    case WHITE = 'white';
    case BLACK = 'black';
    case RANDOM = 'random';
}
