<?php

declare(strict_types=1);

namespace CloudChess\Core\Ports;

use Closure;

interface TransactionRunner
{
    /**
     * @template T
     * @param Closure(): T $operation
     * @return T
     */
    public function run(Closure $operation): mixed;
}
