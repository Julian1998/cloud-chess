<?php

declare(strict_types=1);

namespace CloudChess\Core\Domain;

use DateInterval;
use DateTimeImmutable;

enum TurnDuration: string
{
    case ONE_DAY = 'P1D';
    case TWO_DAYS = 'P2D';

    public function deadlineFrom(DateTimeImmutable $startedAt): DateTimeImmutable
    {
        return $startedAt->add(new DateInterval($this->value));
    }
}
