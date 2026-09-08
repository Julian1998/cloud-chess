<?php

declare(strict_types=1);

namespace CloudChess\Core\Ports;

use CloudChess\Core\Domain\Game;

interface GameRepository
{
    public function save(Game $game): void;
}
