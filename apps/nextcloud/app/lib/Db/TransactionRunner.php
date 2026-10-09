<?php

declare(strict_types=1);

namespace OCA\CloudChess\Db;

use Closure;
use CloudChess\Core\Ports\TransactionRunner as TransactionRunnerPort;
use OCP\DB\Exception;
use OCP\IDBConnection;
use Throwable;

final class TransactionRunner implements TransactionRunnerPort
{
    public function __construct(private IDBConnection $db)
    {
    }

    public function run(Closure $operation): mixed
    {
        if ($this->db->inTransaction()) {
            return $operation();
        }
        $this->db->beginTransaction();
        try {
            $result = $operation();
            $this->db->commit();

            return $result;
        } catch (Throwable $exception) {
            $this->db->rollBack();
            throw $exception;
        }
    }

    public function forPair(string $challenger, string $opponent, Closure $operation): mixed
    {
        $key = hash('sha256', json_encode([$challenger, $opponent], JSON_THROW_ON_ERROR));
        // Create outside the transaction: a duplicate insert must not poison a PostgreSQL transaction.
        $query = $this->db->getQueryBuilder();
        try {
            $query
                ->insert('cc_pair_locks')
                ->values(['pair_id' => $query->createNamedParameter($key)])
                ->executeStatement();
        } catch (Exception $exception) {
            if ($exception->getReason() !== Exception::REASON_UNIQUE_CONSTRAINT_VIOLATION) {
                throw $exception;
            }
        }

        return $this->run(function () use ($key, $operation) {
            $query = $this->db->getQueryBuilder();
            // An UPDATE takes a write lock held until commit, even when the value is unchanged.
            $query
                ->update('cc_pair_locks')
                ->set('pair_id', $query->createNamedParameter($key))
                ->where($query->expr()->eq('pair_id', $query->createNamedParameter($key)))
                ->executeStatement();

            return $operation();
        });
    }
}
