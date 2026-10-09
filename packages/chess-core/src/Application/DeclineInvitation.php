<?php

declare(strict_types=1);

namespace CloudChess\Core\Application;

use CloudChess\Core\Domain\Aggregate\GameInvitation;
use CloudChess\Core\Ports\Clock;
use CloudChess\Core\Ports\GameInvitationRepository;
use CloudChess\Core\Ports\TransactionRunner;

final readonly class DeclineInvitation
{
    public function __construct(
        private GameInvitationRepository $invitations,
        private Clock $clock,
        private TransactionRunner $transactions,
    ) {
    }

    public function __invoke(DeclineInvitationCommand $command): GameInvitation
    {
        /** @var GameInvitation */
        return $this->transactions->run(function () use (
            $command,
        ): GameInvitation {
            $invitation = $this->invitations->get($command->invitationId);
            $invitation->decline($command->actorId, $this->clock->now());
            $this->invitations->save($invitation);

            return $invitation;
        });
    }
}
