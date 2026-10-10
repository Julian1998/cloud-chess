<?php

declare(strict_types=1);

namespace OCA\Chess\Notification;

use CloudChess\Core\Domain\Aggregate\GameInvitation;
use DateTime;
use OCP\IURLGenerator;
use OCP\Notification\IManager;
use Psr\Log\LoggerInterface;
use Throwable;

final class InvitationNotifications
{
    public function __construct(
        private IManager $manager,
        private LoggerInterface $logger,
        private IURLGenerator $url,
    ) {
    }

    public function update(GameInvitation $invitation): ?string
    {
        try {
            $notification = $this->manager
                ->createNotification()
                ->setApp('chess')
                ->setObject('invitation', $invitation->id()->toString())
                ->setUser($invitation->opponentId()->toString());

            if (!$invitation->isPending()) {
                $this->manager->markProcessed($notification);

                return null;
            }

            $notification
                ->setDateTime(DateTime::createFromImmutable($invitation->createdAt()))
                ->setSubject('invitation');

            foreach (['accept', 'decline'] as $label) {
                $notification->addAction(
                    $notification
                        ->createAction()
                        ->setLabel($label)
                        ->setLink(
                            $this->url->linkToRouteAbsolute('chess.invitation.' . $label, [
                                'id' => $invitation->id()->toString(),
                            ]),
                            'POST',
                        ),
                );
            }

            $this->manager->notify($notification);

            return null;
        } catch (Throwable $exception) {
            $this->logger->error('Chess notification failed after invitation commit', [
                'app' => 'chess',
                'exception' => $exception,
            ]);

            return 'Gespeichert, aber die Nextcloud-Benachrichtigung konnte nicht aktualisiert werden. Die Einladung ist in der App verfügbar.';
        }
    }
}
