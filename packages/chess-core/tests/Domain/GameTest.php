<?php

declare(strict_types=1);

namespace CloudChess\Core\Tests\Domain;

use CloudChess\Core\Domain\Game;
use CloudChess\Core\Domain\GameId;
use CloudChess\Core\Domain\PlayerAssignment;
use CloudChess\Core\Domain\PlayerId;
use CloudChess\Core\Domain\TurnDuration;
use DateTimeImmutable;
use DomainException;
use PHPUnit\Framework\TestCase;

final class GameTest extends TestCase
{
    public function test_game_owns_assigned_colors_and_first_turn_deadline(): void
    {
        $game = Game::start(
            GameId::fromString('game-1'),
            PlayerAssignment::withWhiteAndBlack(PlayerId::fromString('white'), PlayerId::fromString('black')),
            TurnDuration::TWO_DAYS,
            new DateTimeImmutable('2026-09-08T12:00:00+00:00'),
        );

        self::assertSame('game-1', $game->id()->toString());
        self::assertSame('white', $game->whitePlayerId()->toString());
        self::assertSame('black', $game->blackPlayerId()->toString());
        self::assertSame(TurnDuration::TWO_DAYS, $game->turnDuration());
        self::assertSame('2026-09-08T12:00:00+00:00', $game->startedAt()->format(DATE_ATOM));
        self::assertSame('2026-09-10T12:00:00+00:00', $game->turnDeadline()->format(DATE_ATOM));
    }

    public function test_color_assignment_rejects_the_same_player_twice(): void
    {
        $this->expectException(DomainException::class);

        PlayerAssignment::withWhiteAndBlack(PlayerId::fromString('same'), PlayerId::fromString('same'));
    }
}
