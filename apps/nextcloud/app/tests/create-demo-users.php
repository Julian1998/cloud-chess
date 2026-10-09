<?php

declare(strict_types=1);
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit();
}
require_once '/var/www/html/lib/base.php';
set_exception_handler(function (Throwable $e): never {
    fwrite(STDERR, $e->getMessage() . PHP_EOL);
    exit(1);
});
$users = \OCP\Server::get(\OCP\IUserManager::class);
$password = getenv('CLOUD_CHESS_DEMO_PASSWORD');
if (!$password || strlen($password) < 16) {
    throw new RuntimeException('Provide CLOUD_CHESS_DEMO_PASSWORD (at least 16 characters).');
}
foreach (
    ['chess_alice' => 'Alice (Schach-Demo)', 'chess_bob' => 'Bob (Schach-Demo)', 'chess_carla' => 'Carla (Schach-Demo)'] as $id => $name
) {
    if ($users->userExists($id)) {
        echo "$id exists; unchanged\n";
        continue;
    }
    $user = $users->createUser($id, $password);
    if (!$user) {
        throw new RuntimeException('Could not create demo user');
    }
    $user->setDisplayName($name);
    echo "$id created\n";
}
