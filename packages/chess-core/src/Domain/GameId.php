<?php

declare(strict_types=1);

namespace CloudChess\Core\Domain;

use InvalidArgumentException;

final readonly class GameId
{
    private function __construct(private string $value)
    {
    }

    public static function fromString(string $value): self
    {
        if ($value === '') {
            throw new InvalidArgumentException('Game ID must not be empty.');
        }

        return new self($value);
    }

    public function toString(): string
    {
        return $this->value;
    }
}
