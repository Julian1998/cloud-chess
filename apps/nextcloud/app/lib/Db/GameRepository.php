<?php

declare(strict_types=1);

namespace OCA\Chess\Db;

use CloudChess\Core\Domain\Aggregate\Game;
use CloudChess\Core\Ports\GameRepository as GameRepositoryPort;
use OCP\IDBConnection;

use function array_map;
use function gmdate;

final class GameRepository implements GameRepositoryPort
{
    public function __construct(private IDBConnection $db)
    {
    }

    public function save(Game $game): void
    {
        $query = $this->db->getQueryBuilder();
        $data = [
            'id' => $game->id()->toString(),
            'white_player' => $game->whitePlayerId()->toString(),
            'black_player' => $game->blackPlayerId()->toString(),
            'duration' => $game->turnDuration()->value,
            'started_at' => $game->startedAt()->getTimestamp(),
            'turn_deadline' => $game->turnDeadline()->getTimestamp(),
        ];
        $query
            ->insert('cc_games')
            ->values(array_map(fn ($value) => $query->createNamedParameter($value), $data))
            ->executeStatement();
    }

    public function summary(string $id): ?array
    {
        $query = $this->db->getQueryBuilder();
        $row = $query
            ->select('*')
            ->from('cc_games')
            ->where($query->expr()->eq('id', $query->createNamedParameter($id)))
            ->executeQuery()
            ->fetchAssociative();

        return $row === false
            ? null
            : [
                'id' => $row['id'],
                'whitePlayerId' => $row['white_player'],
                'blackPlayerId' => $row['black_player'],
                'turnDeadline' => gmdate(DATE_ATOM, (int) $row['turn_deadline']),
            ];
    }
}
