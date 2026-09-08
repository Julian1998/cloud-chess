<?php

declare(strict_types=1);

namespace CloudChess\Core\Ports;

use DateTimeImmutable;

interface Clock
{
    public function now(): DateTimeImmutable;
}
