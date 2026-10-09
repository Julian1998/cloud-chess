<?php

declare(strict_types=1);

namespace OCA\CloudChess\AppInfo;

use OCA\CloudChess\Notification\Notifier;
use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;

require_once __DIR__ . '/../../vendor/autoload.php';

final class Application extends App implements IBootstrap
{
    public function __construct(array $urlParams = [])
    {
        parent::__construct('cloud_chess', $urlParams);
    }

    public function register(IRegistrationContext $context): void
    {
        $context->registerNotifierService(Notifier::class);
    }

    public function boot(IBootContext $context): void
    {
    }
}
