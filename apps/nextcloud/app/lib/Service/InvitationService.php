<?php

declare(strict_types=1);

namespace OCA\CloudChess\Service;

use CloudChess\Core\Application\AcceptInvitation;
use CloudChess\Core\Application\AcceptInvitationCommand;
use CloudChess\Core\Application\CreateInvitation;
use CloudChess\Core\Application\CreateInvitationCommand;
use CloudChess\Core\Application\DeclineInvitation;
use CloudChess\Core\Application\DeclineInvitationCommand;
use CloudChess\Core\Domain\Aggregate\GameInvitation;
use CloudChess\Core\Domain\Enum\ColorPreference;
use CloudChess\Core\Domain\Enum\TurnDuration;
use CloudChess\Core\Domain\ValueObject\GameId;
use CloudChess\Core\Domain\ValueObject\GameInvitationId;
use CloudChess\Core\Domain\ValueObject\PlayerId;
use InvalidArgumentException;
use OCA\CloudChess\Db\GameRepository;
use OCA\CloudChess\Db\InvitationRepository;
use OCA\CloudChess\Db\TransactionRunner;
use OCA\CloudChess\Notification\InvitationNotifications;
use OCP\IUserManager;

final class InvitationService
{
    public function __construct(
        private InvitationRepository $invitations,
        private GameRepository $games,
        private TransactionRunner $transactions,
        private SystemClock $clock,
        private ColorAssigner $colors,
        private IUserManager $users,
        private UserDirectory $directory,
        private InvitationNotifications $notifications,
    ) {
    }

    public function list(string $actor): array
    {
        return array_map($this->present(...), $this->invitations->forUser($actor));
    }

    public function create(
        string $actor,
        string $opponent,
        string $color,
        string $duration,
        string $opponentSearch = '',
    ): array {
        if (strlen($opponent) > 64 || $actor === $opponent) {
            throw new InvalidArgumentException('Bitte einen anderen Benutzer wählen.');
        }

        $preference = ColorPreference::tryFrom($color);
        $turnDuration = TurnDuration::tryFrom($duration);
        if ($preference === null || $turnDuration === null) {
            throw new InvalidArgumentException('Ungültige Farbe oder Zugfrist.');
        }

        $this->directory->assertVisible($actor, $opponent, $opponentSearch);
        $invitation = $this->transactions->forPair(
            $actor,
            $opponent,
            function () use ($actor, $opponent, $preference, $turnDuration) {
                $create = new CreateInvitation($this->invitations, $this->clock);
                $command = new CreateInvitationCommand(
                    GameInvitationId::fromString(bin2hex(random_bytes(16))),
                    PlayerId::fromString($actor),
                    PlayerId::fromString($opponent),
                    $preference,
                    $turnDuration,
                );

                return $create($command);
            },
        );

        return $this->response($invitation);
    }

    public function respond(string $actor, string $id, bool $accept): array
    {
        if (!preg_match('/^[a-f0-9]{32}$/D', $id)) {
            throw new InvitationNotFound();
        }

        $invitationId = GameInvitationId::fromString($id);
        $original = $this->invitations->get($invitationId);
        if ($original->opponentId()->toString() !== $actor) {
            throw new InvitationNotFound();
        }
        $invitation = $this->transactions->forPair(
            $original->challengerId()->toString(),
            $actor,
            function () use ($actor, $invitationId, $id, $accept) {
                if ($accept) {
                    $acceptInvitation = new AcceptInvitation(
                        $this->invitations,
                        $this->games,
                        $this->colors,
                        $this->clock,
                        $this->transactions,
                    );
                    $command = new AcceptInvitationCommand(
                        $invitationId,
                        PlayerId::fromString($actor),
                        GameId::fromString($id),
                    );
                    $acceptInvitation($command);

                    return $this->invitations->get($invitationId);
                }

                $decline = new DeclineInvitation($this->invitations, $this->clock, $this->transactions);
                $command = new DeclineInvitationCommand($invitationId, PlayerId::fromString($actor));

                return $decline($command);
            },
        );

        return $this->response($invitation);
    }

    private function response(GameInvitation $invitation): array
    {
        $warning = $this->notifications->update($invitation);
        $response = ['invitation' => $this->present($invitation)];
        if ($warning !== null) {
            $response['warning'] = $warning;
        }

        return $response;
    }

    private function present(GameInvitation $invitation): array
    {
        $invitation->expireIfDue($this->clock->now());
        $challengerId = $invitation->challengerId()->toString();
        $opponentId = $invitation->opponentId()->toString();

        return [
            'id' => $invitation->id()->toString(),
            'challengerId' => $challengerId,
            'challengerName' => $this->users->get($challengerId)?->getDisplayName() ?? $challengerId,
            'opponentId' => $opponentId,
            'opponentName' => $this->users->get($opponentId)?->getDisplayName() ?? $opponentId,
            'colorPreference' => $invitation->colorPreference()->value,
            'turnDuration' => $invitation->turnDuration()->value,
            'status' => $invitation->status()->value,
            'createdAt' => $invitation->createdAt()->format(DATE_ATOM),
            'expiresAt' => $invitation->expiresAt()->format(DATE_ATOM),
            'game' => $this->games->summary($invitation->id()->toString()),
        ];
    }
}
