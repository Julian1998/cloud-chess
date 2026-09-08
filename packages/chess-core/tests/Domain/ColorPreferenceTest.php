<?php

declare(strict_types=1);

namespace CloudChess\Core\Tests\Domain;

use CloudChess\Core\Domain\ColorPreference;
use PHPUnit\Framework\TestCase;

final class ColorPreferenceTest extends TestCase
{
    public function test_exposes_the_three_supported_preferences(): void
    {
        self::assertSame(
            ['white', 'black', 'random'],
            array_map(static fn (ColorPreference $preference): string => $preference->value, ColorPreference::cases()),
        );
    }
}
