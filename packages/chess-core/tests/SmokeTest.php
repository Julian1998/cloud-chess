<?php

declare(strict_types=1);

namespace CloudChess\Core\Tests;

use PHPUnit\Framework\TestCase;

use function function_exists;

final class SmokeTest extends TestCase
{
    public function test_php_83_runtime_is_available(): void
    {
        self::assertTrue(function_exists('json_validate'));
    }
}
