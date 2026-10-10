<?php

declare(strict_types=1);

namespace OCA\Chess\Db;

use CloudChess\Core\Domain\Aggregate\GameInvitation;
use CloudChess\Core\Domain\Enum\ColorPreference;
use CloudChess\Core\Domain\Enum\InvitationStatus;
use CloudChess\Core\Domain\Enum\TurnDuration;
use CloudChess\Core\Domain\ValueObject\GameInvitationId;
use CloudChess\Core\Domain\ValueObject\PlayerId;
use CloudChess\Core\Ports\GameInvitationRepository as GameInvitationRepository;
use DateTimeImmutable;
use OCA\Chess\Service\InvitationNotFound;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

use function array_map;

final class InvitationRepository implements GameInvitationRepository
{
    public function __construct(private IDBConnection $db)
    {
    }

    public function get(GameInvitationId $id): GameInvitation
    {
        $query = $this->db->getQueryBuilder();
        $row = $query
            ->select('*')
            ->from('cc_invitations')
            ->where($query->expr()->eq('id', $query->createNamedParameter($id->toString())))
            ->executeQuery()
            ->fetchAssociative();

        if ($row === false) {
            throw new InvitationNotFound();
        }

        return $this->restore($row);
    }

    public function save(GameInvitation $invitation): void
    {
        $this->db->setValues(
            '*PREFIX*cc_invitations',
            ['id' => $invitation->id()->toString()],
            [
                'challenger' => $invitation->challengerId()->toString(),
                'opponent' => $invitation->opponentId()->toString(),
                'color' => $invitation->colorPreference()->value,
                'duration' => $invitation->turnDuration()->value,
                'status' => $invitation->status()->value,
                'created_at' => $invitation->createdAt()->getTimestamp(),
                'expires_at' => $invitation->expiresAt()->getTimestamp(),
            ],
        );
    }

    public function hasPending(PlayerId $challenger, PlayerId $opponent, DateTimeImmutable $now): bool
    {
        $query = $this->db->getQueryBuilder();

        return $query
            ->select('id')
            ->from('cc_invitations')
            ->where(
                $query->expr()->eq('challenger', $query->createNamedParameter($challenger->toString())),
                $query->expr()->eq('opponent', $query->createNamedParameter($opponent->toString())),
                $query->expr()->eq('status', $query->createNamedParameter('pending')),
                $query
                    ->expr()
                    ->gt(
                        'expires_at',
                        $query->createNamedParameter(
                            $now->getTimestamp(),
                            IQueryBuilder::PARAM_INT,
                        ),
                    ),
            )
            ->setMaxResults(1)
            ->executeQuery()
            ->fetchOne() !== false;
    }

    /** @return list<GameInvitation> */
    public function forUser(string $uid): array
    {
        $query = $this->db->getQueryBuilder();
        $rows = $query
            ->select('*')
            ->from('cc_invitations')
            ->where(
                $query
                    ->expr()
                    ->orX(
                        $query->expr()->eq('challenger', $query->createNamedParameter($uid)),
                        $query->expr()->eq('opponent', $query->createNamedParameter($uid)),
                    ),
            )
            ->orderBy('created_at', 'DESC')
            ->addOrderBy('id', 'DESC')
            ->executeQuery()
            ->fetchAllAssociative();

        return array_map($this->restore(...), $rows);
    }

    private function restore(array $row): GameInvitation
    {
        return GameInvitation::restore(
            GameInvitationId::fromString($row['id']),
            PlayerId::fromString($row['challenger']),
            PlayerId::fromString($row['opponent']),
            ColorPreference::from($row['color']),
            TurnDuration::from($row['duration']),
            new DateTimeImmutable('@' . $row['created_at']),
            InvitationStatus::from($row['status']),
        );
    }
}
