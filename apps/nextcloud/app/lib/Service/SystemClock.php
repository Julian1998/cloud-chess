<?php

declare(strict_types=1);

namespace OCA\CloudChess\Service;

final class SystemClock implements \CloudChess\Core\Ports\Clock
{
    public function now(): \DateTimeImmutable
    {
        return new \DateTimeImmutable('now', new \DateTimeZone('UTC'));
    }
}
