<?php

declare(strict_types=1);

namespace OCA\Chess\Migration;

use Closure;
use OCP\IDBConnection;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

final class Version000002Date20261010000000 extends SimpleMigrationStep
{
    public function __construct(private IDBConnection $db)
    {
    }

    public function postSchemaChange(IOutput $output, Closure $schemaClosure, array $options): void
    {
        if (!$schemaClosure()->hasTable('notifications')) {
            return;
        }

        // Retain pending notifications when adopting the renamed app.
        $query = $this->db->getQueryBuilder();
        $query->update('notifications')
            ->set('app', $query->createNamedParameter('chess'))
            ->where($query->expr()->eq('app', $query->createNamedParameter('cloud_chess')))
            ->executeStatement();
    }
}
