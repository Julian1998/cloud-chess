<?php

declare(strict_types=1);
use CloudChess\Core\Application\DuplicatePendingInvitation;
use CloudChess\Core\Domain\Exception\InvitationStateException;
use OCA\Chess\Service\InvitationService;
use OCP\App\IAppManager;
use OCP\IUserManager;
use OCP\IUserSession;
use OCP\Server;

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit();
}
require_once '/var/www/html/lib/base.php';
Server::get(IAppManager::class)->loadApps();
set_exception_handler(function (Throwable $e): never {
    fwrite(STDERR, $e->getMessage() . PHP_EOL);
    exit(1);
});
$service = Server::get(InvitationService::class);
$users = Server::get(IUserManager::class);

if (($argv[1] ?? '') === 'worker') {
    [, , $action, $a, $b, $id, $start] = $argv;
    Server::get(IUserSession::class)->setUser($users->get($a));
    while (microtime(true) < (float) $start) {
        usleep(1000);
    }

    try {
        $action === 'create' ? $service->create($a, $b, 'random', 'P1D') : $service->respond($b, $id, true);
        echo 'ok';
    } catch (DuplicatePendingInvitation | InvitationStateException) {
        echo 'conflict';
    }
    exit(0);
}
function race(string $action, string $a, string $b, string $id = '-'): void
{
    $children = [];
    $start = (string) (microtime(true) + 1);
    for ($i = 0; $i < 2; $i++) {
        $process = proc_open(
            [PHP_BINARY, __FILE__, 'worker', $action, $a, $b, $id, $start],
            [1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
            $pipes,
        );

        if ($process === false) {
            throw new RuntimeException('Cannot start race worker');
        }
        $children[] = [$process, $pipes];
    }
    $results = [];

    foreach ($children as [$process, $pipes]) {
        $result = stream_get_contents($pipes[1]);
        $error = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);

        if (proc_close($process) !== 0) {
            throw new RuntimeException('Race failed: ' . $error);
        }
        $results[] = $result;
    }
    sort($results);

    if ($results !== ['conflict', 'ok']) {
        throw new RuntimeException('Unexpected race results: ' . json_encode($results));
    }
}
$suffix = bin2hex(random_bytes(4));
$a = 'cc_race_a_' . $suffix;
$b = 'cc_race_b_' . $suffix;

foreach ([$a, $b] as $uid) {
    $users->createUser($uid, bin2hex(random_bytes(24)));
}

try {
    race('create', $a, $b);
    $list = $service->list($a);

    if (count($list) !== 1) {
        throw new RuntimeException('Concurrent create persisted duplicates');
    }
    race('accept', $a, $b, $list[0]['id']);
    $list = $service->list($a);

    if (count($list) !== 1 || $list[0]['status'] !== 'accepted' || $list[0]['game'] === null) {
        throw new RuntimeException('Concurrent acceptance inconsistent');
    }
    echo "PASS: simultaneous create and accept each commit exactly once\n";
} finally {
    foreach ([$a, $b] as $uid) {
        $users->get($uid)?->delete();
    }
}
