<?php

declare(strict_types=1);

namespace OCA\Chess\Notification;

use CloudChess\Core\Domain\ValueObject\GameInvitationId;
use OCA\Chess\Db\InvitationRepository;
use OCA\Chess\Service\InvitationNotFound;
use OCA\Chess\Service\SystemClock;
use OCP\IURLGenerator;
use OCP\IUserManager;
use OCP\L10N\IFactory;
use OCP\Notification\AlreadyProcessedException;
use OCP\Notification\INotification;
use OCP\Notification\INotifier;
use OCP\Notification\UnknownNotificationException;

use function in_array;

final class Notifier implements INotifier
{
    public function __construct(
        private IFactory $l10n,
        private IURLGenerator $url,
        private IUserManager $users,
        private InvitationRepository $invitations,
        private SystemClock $clock,
    ) {
    }

    public function getID(): string
    {
        return 'chess';
    }

    public function getName(): string
    {
        return 'Chess';
    }

    public function prepare(INotification $notification, string $languageCode): INotification
    {
        if (
            $notification->getApp() !== 'chess' ||
            $notification->getSubject() !== 'invitation' ||
            $notification->getObjectType() !== 'invitation'
        ) {
            throw new UnknownNotificationException();
        }

        try {
            $invitation = $this->invitations->get(
                GameInvitationId::fromString($notification->getObjectId()),
            );
        } catch (InvitationNotFound) {
            throw new AlreadyProcessedException();
        }

        $invitation->expireIfDue($this->clock->now());

        if (
            !$invitation->isPending() ||
            $invitation->opponentId()->toString() !== $notification->getUser()
        ) {
            throw new AlreadyProcessedException();
        }

        $translations = $this->l10n->get('chess', $languageCode);
        $challenger = $invitation->challengerId()->toString();
        $name = $this->users->get($challenger)?->getDisplayName() ?? $challenger;

        $notification
            ->setParsedSubject($translations->t('%s lädt dich zu einer Schachpartie ein', [$name]))
            ->setParsedMessage($translations->t('Öffne die App für Farbe, Zugfrist und alle Einladungen.'))
            ->setLink($this->url->linkToRouteAbsolute('chess.page.index'))
            ->setIcon($this->url->getAbsoluteURL($this->url->imagePath('chess', 'app.svg')));

        foreach ($notification->getActions() as $action) {
            if (!in_array($action->getLabel(), ['accept', 'decline'], true)) {
                continue;
            }

            $accept = $action->getLabel() === 'accept';

            $action
                ->setParsedLabel($translations->t($accept ? 'Annehmen' : 'Ablehnen'))
                ->setPrimary($accept)
                ->setLink(
                    $this->url->linkToRouteAbsolute('chess.invitation.' . ($accept ? 'accept' : 'decline'), [
                        'id' => $invitation->id()->toString(),
                    ]),
                    'POST',
                );

            $notification->addParsedAction($action);
        }

        return $notification;
    }
}
