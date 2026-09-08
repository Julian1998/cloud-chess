<?php

declare(strict_types=1);

namespace CloudChess\Core\Domain;

use DateTimeImmutable;

final readonly class Game
{
    private function __construct(
        private GameId $id,
        private PlayerAssignment $players,
        private TurnDuration $turnDuration,
        private DateTimeImmutable $startedAt,
        private DateTimeImmutable $turnDeadline,
    ) {
    }

    public static function start(
        GameId $id,
        PlayerAssignment $players,
        TurnDuration $turnDuration,
        DateTimeImmutable $startedAt,
    ): self {
        return new self($id, $players, $turnDuration, $startedAt, $turnDuration->deadlineFrom($startedAt));
    }

    public function id(): GameId
    {
        return $this->id;
    }

    public function whitePlayerId(): PlayerId
    {
        return $this->players->whitePlayerId();
    }

    public function blackPlayerId(): PlayerId
    {
        return $this->players->blackPlayerId();
    }

    public function turnDeadline(): DateTimeImmutable
    {
        return $this->turnDeadline;
    }

    public function turnDuration(): TurnDuration
    {
        return $this->turnDuration;
    }

    public function startedAt(): DateTimeImmutable
    {
        return $this->startedAt;
    }
}
