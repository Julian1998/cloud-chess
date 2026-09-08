<?php

declare(strict_types=1);

namespace CloudChess\Core\Tests\Application;

use Closure;
use CloudChess\Core\Ports\TransactionRunner;

final class ImmediateTransactionRunner implements TransactionRunner
{
    public function run(Closure $operation): mixed
    {
        return $operation();
    }
}
