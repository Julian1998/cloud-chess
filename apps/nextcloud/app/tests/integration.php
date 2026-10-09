<?php

// Run with: php custom_apps/cloud_chess/tests/integration.php
// Uses dedicated local test accounts only; no messages are sent to real users.
declare(strict_types=1);
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit();
}
require_once '/var/www/html/lib/base.php';
\OCP\Server::get(\OCP\App\IAppManager::class)->loadApps();
set_exception_handler(function (Throwable $e): never {
    fwrite(STDERR, get_class($e) . ': ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString() . PHP_EOL);
    exit(1);
});
if (!class_exists(\OCA\CloudChess\Service\InvitationService::class)) {
    fwrite(STDERR, "FAIL: Cloud Chess invitation service is not installed\n");
    exit(1);
}
function check(bool $ok, string $message): void
{
    if (!$ok) {
        throw new RuntimeException($message);
    }
}
$service = \OCP\Server::get(\OCA\CloudChess\Service\InvitationService::class);
$users = \OCP\Server::get(\OCP\IUserManager::class);
$suffix = bin2hex(random_bytes(4));
$a = 'cc_test_a_' . $suffix;
$b = 'cc_test_b_' . $suffix;
$c = 'cc_test_c_' . $suffix;
foreach ([$a, $b, $c] as $uid) {
    $users->createUser($uid, bin2hex(random_bytes(24)));
}
\OCP\Server::get(\OCP\IUserSession::class)->setUser($users->get($a));
try {
    $created = $service->create($a, $b, 'white', 'P1D');
    check(!isset($created['warning']), 'Notification publish failed');
    $sent = $created['invitation'];
    $notificationManager = \OCP\Server::get(\OCP\Notification\IManager::class);
    $handler = \OCP\Server::get(\OCA\Notifications\Handler::class);
    $storedNotice = $notificationManager
        ->createNotification()
        ->setApp('cloud_chess')
        ->setUser($b)
        ->setObject('invitation', $sent['id']);
    check($handler->count($storedNotice) === 1, 'Notification not stored');
    check($sent['status'] === 'pending', 'Invitation not pending');
    check(count($service->list($b)) === 1, 'Recipient cannot see invitation');
    check($service->list($c) === [], 'Third user sees invitation');
    try {
        $service->create($a, $b, 'black', 'P2D');
        throw new RuntimeException('Duplicate accepted');
    } catch (\CloudChess\Core\Application\DuplicatePendingInvitation) {
    }
    try {
        $service->respond($c, $sent['id'], true);
        throw new RuntimeException('Foreign acceptance allowed');
    } catch (\OCA\CloudChess\Service\InvitationNotFound) {
    }
    $accepted = $service->respond($b, $sent['id'], true)['invitation'];
    check($accepted['status'] === 'accepted', 'Not accepted');
    check($handler->count($storedNotice) === 0, 'Accepted notification not removed');
    check($accepted['game']['whitePlayerId'] === $a && $accepted['game']['blackPlayerId'] === $b, 'Wrong colors');
    try {
        $service->respond($b, $sent['id'], true);
        throw new RuntimeException('Repeated acceptance allowed');
    } catch (\CloudChess\Core\Domain\Exception\InvitationStateException) {
    }
    $next = $service->create($a, $b, 'black', 'P2D')['invitation'];
    $declined = $service->respond($b, $next['id'], false)['invitation'];
    check($declined['status'] === 'declined' && $declined['game'] === null, 'Decline created game');
    check(count($service->list($a)) === 2, 'State did not persist');

    $repo = \OCP\Server::get(\OCA\CloudChess\Db\InvitationRepository::class);
    $games = \OCP\Server::get(\OCA\CloudChess\Db\GameRepository::class);
    $tx = \OCP\Server::get(\OCA\CloudChess\Db\TransactionRunner::class);
    $clock = \OCP\Server::get(\OCA\CloudChess\Service\SystemClock::class);
    $colors = \OCP\Server::get(\OCA\CloudChess\Service\ColorAssigner::class);
    $pending = $service->create($a, $b, 'black', 'P2D')['invitation'];
    $id = \CloudChess\Core\Domain\ValueObject\GameInvitationId::fromString($pending['id']);
    $failingGames = new class ($games) implements \CloudChess\Core\Ports\GameRepository {
        public function __construct(private \OCA\CloudChess\Db\GameRepository $games)
        {
        }

        public function save(\CloudChess\Core\Domain\Aggregate\Game $game): void
        {
            $this->games->save($game);
            throw new RuntimeException('simulated storage failure');
        }
    };
    try {
        $tx->forPair(
            $a,
            $b,
            fn () => (new \CloudChess\Core\Application\AcceptInvitation($repo, $failingGames, $colors, $clock, $tx))(
                new \CloudChess\Core\Application\AcceptInvitationCommand(
                    $id,
                    \CloudChess\Core\Domain\ValueObject\PlayerId::fromString($b),
                    \CloudChess\Core\Domain\ValueObject\GameId::fromString($pending['id']),
                ),
            ),
        );
        throw new RuntimeException('Failure injection did not fail');
    } catch (RuntimeException $e) {
        check($e->getMessage() === 'simulated storage failure', $e->getMessage());
    }
    check($repo->get($id)->isPending(), 'Rollback left invitation accepted');
    check($games->summary($pending['id']) === null, 'Rollback left game persisted');

    $notifier = \OCP\Server::get(\OCA\CloudChess\Notification\Notifier::class);
    $manager = \OCP\Server::get(\OCP\Notification\IManager::class);
    $notice = $manager
        ->createNotification()
        ->setApp('cloud_chess')
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
    } catch (\OCP\Notification\AlreadyProcessedException) {
    }

    $expiredId = \CloudChess\Core\Domain\ValueObject\GameInvitationId::fromString(bin2hex(random_bytes(16)));
    $expired = \CloudChess\Core\Domain\Aggregate\GameInvitation::create(
        $expiredId,
        \CloudChess\Core\Domain\ValueObject\PlayerId::fromString($a),
        \CloudChess\Core\Domain\ValueObject\PlayerId::fromString($b),
        \CloudChess\Core\Domain\Enum\ColorPreference::WHITE,
        \CloudChess\Core\Domain\Enum\TurnDuration::ONE_DAY,
        $clock->now()->modify('-8 days'),
    );
    $repo->save($expired);
    try {
        $service->respond($b, $expiredId->toString(), true);
        throw new RuntimeException('Expired acceptance allowed');
    } catch (\CloudChess\Core\Domain\Exception\InvitationStateException) {
    }
    check($games->summary($expiredId->toString()) === null, 'Expired acceptance created game');
    $notice->setObject('invitation', $expiredId->toString());
    try {
        $notifier->prepare($notice, 'de');
        throw new RuntimeException('Expired notice still actionable');
    } catch (\OCP\Notification\AlreadyProcessedException) {
    }
    check(
        $service->create($a, $b, 'white', 'P1D')['invitation']['status'] === 'pending',
        'Expired invitation blocked new one',
    );

    $open = array_values(array_filter($service->list($a), fn ($i) => $i['status'] === 'pending'))[0];
    $service->respond($b, $open['id'], false);
    $users->get($b)->setDisplayName('Recipient ' . $suffix);
    $config = \OCP\Server::get(\OCP\IAppConfig::class);
    $keys = ['shareapi_allow_share_dialog_user_enumeration', 'shareapi_restrict_user_enumeration_full_match_user_id'];
    $previous = [];
    try {
        foreach ($keys as $key) {
            $previous[$key] = $config->getValueString('core', $key, 'yes');
            $config->setValueString('core', $key, 'no');
        }
        $directory = \OCP\Server::get(\OCA\CloudChess\Service\UserDirectory::class);
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
