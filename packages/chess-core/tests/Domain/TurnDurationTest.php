<?php

declare(strict_types=1);

namespace CloudChess\Core\Tests\Domain;

use CloudChess\Core\Domain\TurnDuration;
use DateTimeImmutable;
use PHPUnit\Framework\TestCase;

final class TurnDurationTest extends TestCase
{
    public function test_one_day_adds_one_calendar_day(): void
    {
        $now = new DateTimeImmutable('2026-09-06T12:00:00+00:00');

        self::assertSame(
            '2026-09-07T12:00:00+00:00',
            TurnDuration::ONE_DAY->deadlineFrom($now)->format(DATE_ATOM),
        );
    }

    public function test_two_days_adds_two_calendar_days(): void
    {
        $now = new DateTimeImmutable('2026-09-06T12:00:00+00:00');

        self::assertSame(
            '2026-09-08T12:00:00+00:00',
            TurnDuration::TWO_DAYS->deadlineFrom($now)->format(DATE_ATOM),
        );
    }
}
