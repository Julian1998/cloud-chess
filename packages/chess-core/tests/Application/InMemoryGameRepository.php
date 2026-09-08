<?php

declare(strict_types=1);

namespace CloudChess\Core\Tests\Application;

use CloudChess\Core\Domain\Aggregate\Game;
use CloudChess\Core\Domain\ValueObject\GameId;
use CloudChess\Core\Ports\GameRepository;
use RuntimeException;

final class InMemoryGameRepository implements GameRepository
{
    /** @var array<string, Game> */
    private array $games = [];

    public function save(Game $game): void
    {
        $this->games[$game->id()->toString()] = $game;
    }

    public function get(GameId $id): Game
    {
        return $this->games[$id->toString()] ?? throw new RuntimeException('Game not found.');
    }

    public function has(GameId $id): bool
    {
        return isset($this->games[$id->toString()]);
    }
}
