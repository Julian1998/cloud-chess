<?php

// Run with: php custom_apps/chess/tests/integration.php
// Uses dedicated local test accounts only; no messages are sent to real users.
declare(strict_types=1);
use CloudChess\Core\Application\AcceptInvitation;
use CloudChess\Core\Application\AcceptInvitationCommand;
use CloudChess\Core\Application\DuplicatePendingInvitation;
use CloudChess\Core\Domain\Aggregate\Game;
use CloudChess\Core\Domain\Aggregate\GameInvitation;
use CloudChess\Core\Domain\Enum\ColorPreference;
use CloudChess\Core\Domain\Enum\TurnDuration;
use CloudChess\Core\Domain\Exception\InvitationStateException;
use CloudChess\Core\Domain\ValueObject\GameId;
use CloudChess\Core\Domain\ValueObject\GameInvitationId;
use CloudChess\Core\Domain\ValueObject\PlayerId;
use CloudChess\Core\Ports\GameRepository as GameRepositoryPort;
use OC\DB\SchemaWrapper;
use OC\Migration\NullOutput;
use OCA\Chess\Db\GameRepository;
use OCA\Chess\Db\InvitationRepository;
use OCA\Chess\Db\TransactionRunner;
use OCA\Chess\Migration\Version000002Date20261010000000;
use OCA\Chess\Notification\Notifier;
use OCA\Chess\Service\ColorAssigner;
use OCA\Chess\Service\InvitationNotFound;
use OCA\Chess\Service\InvitationService;
use OCA\Chess\Service\SystemClock;
use OCA\Chess\Service\UserDirectory;
use OCA\Notifications\Handler;
use OCP\App\IAppManager;
use OCP\IAppConfig;
use OCP\IDBConnection;
use OCP\IUserManager;
use OCP\IUserSession;
use OCP\Notification\AlreadyProcessedException;
use OCP\Notification\IManager;
use OCP\Server;

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit();
}
require_once '/var/www/html/lib/base.php';
Server::get(IAppManager::class)->loadApps();
set_exception_handler(function (Throwable $e): never {
    fwrite(STDERR, get_class($e) . ': ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString() . PHP_EOL);
    exit(1);
});

if (!class_exists(InvitationService::class)) {
    fwrite(STDERR, "FAIL: Chess invitation service is not installed\n");
    exit(1);
}
function check(bool $ok, string $message): void
{
    if (!$ok) {
        throw new RuntimeException($message);
    }
}
$service = Server::get(InvitationService::class);
$users = Server::get(IUserManager::class);
$suffix = bin2hex(random_bytes(4));
$a = 'cc_test_a_' . $suffix;
$b = 'cc_test_b_' . $suffix;
$c = 'cc_test_c_' . $suffix;

foreach ([$a, $b, $c] as $uid) {
    $users->createUser($uid, bin2hex(random_bytes(24)));
}
Server::get(IUserSession::class)->setUser($users->get($a));

try {
    $created = $service->create($a, $b, 'white', 'P1D');
    check(!isset($created['warning']), 'Notification publish failed');
    $sent = $created['invitation'];
    $notificationManager = Server::get(IManager::class);
    $handler = Server::get(Handler::class);
    $storedNotice = $notificationManager
        ->createNotification()
        ->setApp('chess')
        ->setUser($b)
        ->setObject('invitation', $sent['id']);
    check($handler->count($storedNotice) === 1, 'Notification not stored');
    $db = Server::get(IDBConnection::class);
    $query = $db->getQueryBuilder();
    $query->update('notifications')
        ->set('app', $query->createNamedParameter('cloud_chess'))
        ->where($query->expr()->eq('object_id', $query->createNamedParameter($sent['id'])))
        ->executeStatement();
    $migration = new Version000002Date20261010000000($db);
    $schema = new SchemaWrapper($db->getInner());
    $migration->postSchemaChange(new NullOutput(), fn () => $schema, []);
    $migration->postSchemaChange(new NullOutput(), fn () => $schema, []);
    check($handler->count($storedNotice) === 1, 'Legacy notification not migrated idempotently');
    check($sent['status'] === 'pending', 'Invitation not pending');
    check(count($service->list($b)) === 1, 'Recipient cannot see invitation');
    check($service->list($c) === [], 'Third user sees invitation');

    try {
        $service->create($a, $b, 'black', 'P2D');

        throw new RuntimeException('Duplicate accepted');
    } catch (DuplicatePendingInvitation) {
    }

    try {
        $service->respond($c, $sent['id'], true);

        throw new RuntimeException('Foreign acceptance allowed');
    } catch (InvitationNotFound) {
    }
    $accepted = $service->respond($b, $sent['id'], true)['invitation'];
    check($accepted['status'] === 'accepted', 'Not accepted');
    check($handler->count($storedNotice) === 0, 'Accepted notification not removed');
    check($accepted['game']['whitePlayerId'] === $a && $accepted['game']['blackPlayerId'] === $b, 'Wrong colors');

    try {
        $service->respond($b, $sent['id'], true);

        throw new RuntimeException('Repeated acceptance allowed');
    } catch (InvitationStateException) {
    }
    $next = $service->create($a, $b, 'black', 'P2D')['invitation'];
    $declined = $service->respond($b, $next['id'], false)['invitation'];
    check($declined['status'] === 'declined' && $declined['game'] === null, 'Decline created game');
    check(count($service->list($a)) === 2, 'State did not persist');

    $repo = Server::get(InvitationRepository::class);
    $games = Server::get(GameRepository::class);
    $tx = Server::get(TransactionRunner::class);
    $clock = Server::get(SystemClock::class);
    $colors = Server::get(ColorAssigner::class);
    $pending = $service->create($a, $b, 'black', 'P2D')['invitation'];
    $id = GameInvitationId::fromString($pending['id']);
    $failingGames = new class ($games) implements GameRepositoryPort {
        public function __construct(private GameRepository $games)
        {
        }

        public function save(Game $game): void
        {
            $this->games->save($game);

            throw new RuntimeException('simulated storage failure');
        }
    };

    try {
        $tx->forPair(
            $a,
            $b,
            fn () => (new AcceptInvitation($repo, $failingGames, $colors, $clock, $tx))(
                new AcceptInvitationCommand(
                    $id,
                    PlayerId::fromString($b),
                    GameId::fromString($pending['id']),
                ),
            ),
        );

        throw new RuntimeException('Failure injection did not fail');
    } catch (RuntimeException $e) {
        check($e->getMessage() === 'simulated storage failure', $e->getMessage());
    }
    check($repo->get($id)->isPending(), 'Rollback left invitation accepted');
    check($games->summary($pending['id']) === null, 'Rollback left game persisted');

    $notifier = Server::get(Notifier::class);
    $manager = Server::get(IManager::class);
    $notice = $manager
        ->createNotification()
        ->setApp('chess')
        ->setUser($b)
        ->setObject('invitation', $pending['id'])
        ->setSubject('invitation');
    $prepared = $notifier->prepare($notice, 'de');
    check(str_contains($prepared->getParsedSubject(), $a), 'Notification lost challenger');
    $manager->markProcessed($notice); // Equivalent to dismissing only the notice.
    check($repo->get($id)->isPending(), 'Dismissing notice changed invitation');
    $service->respond($b, $pending['id'], false);

    try {
        $notifier->prepare($notice, 'de');

        throw new RuntimeException('Resolved notice still actionable');
    } catch (AlreadyProcessedException) {
    }

    $expiredId = GameInvitationId::fromString(bin2hex(random_bytes(16)));
    $expired = GameInvitation::create(
        $expiredId,
        PlayerId::fromString($a),
        PlayerId::fromString($b),
        ColorPreference::WHITE,
        TurnDuration::ONE_DAY,
        $clock->now()->modify('-8 days'),
    );
    $repo->save($expired);

    try {
        $service->respond($b, $expiredId->toString(), true);

        throw new RuntimeException('Expired acceptance allowed');
    } catch (InvitationStateException) {
    }
    check($games->summary($expiredId->toString()) === null, 'Expired acceptance created game');
    $notice->setObject('invitation', $expiredId->toString());

    try {
        $notifier->prepare($notice, 'de');

        throw new RuntimeException('Expired notice still actionable');
    } catch (AlreadyProcessedException) {
    }
    check(
        $service->create($a, $b, 'white', 'P1D')['invitation']['status'] === 'pending',
        'Expired invitation blocked new one',
    );

    $open = array_values(array_filter($service->list($a), fn ($i) => $i['status'] === 'pending'))[0];
    $service->respond($b, $open['id'], false);
    $users->get($b)->setDisplayName('Recipient ' . $suffix);
    $config = Server::get(IAppConfig::class);
    $keys = ['shareapi_allow_share_dialog_user_enumeration', 'shareapi_restrict_user_enumeration_full_match_user_id'];
    $previous = [];

    try {
        foreach ($keys as $key) {
            $previous[$key] = $config->getValueString('core', $key, 'yes');
            $config->setValueString('core', $key, 'no');
        }
        $directory = Server::get(UserDirectory::class);
        check(count($directory->search($a, 'Recipient ' . $suffix)) === 1, 'Exact display-name lookup unavailable');
        $byDisplayName = $service->create($a, $b, 'random', 'P1D', 'Recipient ' . $suffix);
        check(
            $byDisplayName['invitation']['opponentId'] === $b,
            'Selection from permitted display-name lookup rejected',
        );
    } finally {
        foreach ($previous as $key => $value) {
            $config->setValueString('core', $key, $value);
        }
    }
    echo "PASS: create/list/duplicate/authorization/accept/repeated accept/decline/persistence/rollback/notification dismissal/expiry/restricted discovery\n";
} finally {
    // Keep rows as evidence; delete only accounts created by this invocation.
    foreach ([$a, $b, $c] as $uid) {
        $users->get($uid)?->delete();
    }
}
