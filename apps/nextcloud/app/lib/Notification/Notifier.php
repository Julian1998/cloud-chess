<?php

declare(strict_types=1);

namespace OCA\CloudChess\Notification;

use CloudChess\Core\Domain\ValueObject\GameInvitationId;
use OCA\CloudChess\Db\InvitationRepository;
use OCA\CloudChess\Service\InvitationNotFound;
use OCA\CloudChess\Service\SystemClock;
use OCP\IURLGenerator;
use OCP\IUserManager;
use OCP\L10N\IFactory;
use OCP\Notification\AlreadyProcessedException;
use OCP\Notification\INotification;
use OCP\Notification\INotifier;
use OCP\Notification\UnknownNotificationException;

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
        return 'cloud_chess';
    }

    public function getName(): string
    {
        return 'Cloud Chess';
    }

    public function prepare(INotification $notification, string $languageCode): INotification
    {
        if (
            $notification->getApp() !== 'cloud_chess' ||
            $notification->getSubject() !== 'invitation' ||
            $notification->getObjectType() !== 'invitation'
        ) {
            throw new UnknownNotificationException();
        }
        try {
            $invitation = $this->invitations->get(GameInvitationId::fromString($notification->getObjectId()));
        } catch (InvitationNotFound) {
            throw new AlreadyProcessedException();
        }
        $invitation->expireIfDue($this->clock->now());
        if (!$invitation->isPending() || $invitation->opponentId()->toString() !== $notification->getUser()) {
            throw new AlreadyProcessedException();
        }
        $translations = $this->l10n->get('cloud_chess', $languageCode);
        $challenger = $invitation->challengerId()->toString();
        $name = $this->users->get($challenger)?->getDisplayName() ?? $challenger;
        $notification
            ->setParsedSubject($translations->t('%s lädt dich zu einer Schachpartie ein', [$name]))
            ->setParsedMessage($translations->t('Öffne Cloud Chess für Farbe, Zugfrist und alle Einladungen.'))
            ->setLink($this->url->linkToRouteAbsolute('cloud_chess.page.index'))
            ->setIcon($this->url->getAbsoluteURL($this->url->imagePath('cloud_chess', 'app.svg')));
        foreach ($notification->getActions() as $action) {
            if (!in_array($action->getLabel(), ['accept', 'decline'], true)) {
                continue;
            }
            $accept = $action->getLabel() === 'accept';
            $action
                ->setParsedLabel($translations->t($accept ? 'Annehmen' : 'Ablehnen'))
                ->setPrimary($accept)
                ->setLink(
                    $this->url->linkToRouteAbsolute('cloud_chess.invitation.' . ($accept ? 'accept' : 'decline'), [
                        'id' => $invitation->id()->toString(),
                    ]),
                    'POST',
                );
            $notification->addParsedAction($action);
        }

        return $notification;
    }
}
