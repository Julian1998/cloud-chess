<?php

declare(strict_types=1);

namespace OCA\CloudChess\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

final class Version000001Date20260912000000 extends SimpleMigrationStep
{
    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper
    {
        $schema = $schemaClosure();
        if (!$schema->hasTable('cc_invitations')) {
            $table = $schema->createTable('cc_invitations');
            foreach (
                ['id' => 32, 'challenger' => 64, 'opponent' => 64, 'color' => 6, 'duration' => 3, 'status' => 9] as $name => $length
            ) {
                $table->addColumn($name, 'string', ['length' => $length, 'notnull' => true]);
            }
            foreach (['created_at', 'expires_at'] as $name) {
                $table->addColumn($name, 'bigint', ['notnull' => true]);
            }
            $table->setPrimaryKey(['id']);
            $table->addIndex(['challenger', 'opponent', 'status'], 'cc_inv_pair');
            $table->addIndex(['opponent', 'created_at'], 'cc_inv_received');
        }
        if (!$schema->hasTable('cc_games')) {
            $table = $schema->createTable('cc_games');
            // One game per invitation: game ID is the originating invitation ID.
            foreach (['id' => 32, 'white_player' => 64, 'black_player' => 64, 'duration' => 3] as $name => $length) {
                $table->addColumn($name, 'string', ['length' => $length, 'notnull' => true]);
            }
            foreach (['started_at', 'turn_deadline'] as $name) {
                $table->addColumn($name, 'bigint', ['notnull' => true]);
            }
            $table->setPrimaryKey(['id']);
        }
        if (!$schema->hasTable('cc_pair_locks')) {
            $table = $schema->createTable('cc_pair_locks');
            $table->addColumn('pair_id', 'string', ['length' => 64, 'notnull' => true]);
            $table->setPrimaryKey(['pair_id']);
        }

        return $schema;
    }
}
