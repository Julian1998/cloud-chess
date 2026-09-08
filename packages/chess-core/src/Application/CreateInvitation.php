<?php

declare(strict_types=1);

namespace CloudChess\Core\Application;

use CloudChess\Core\Domain\GameInvitation;
use CloudChess\Core\Ports\Clock;
use CloudChess\Core\Ports\GameInvitationRepository;

final readonly class CreateInvitation
{
    public function __construct(
        private GameInvitationRepository $invitations,
        private Clock $clock,
    ) {
    }

    public function __invoke(CreateInvitationCommand $command): GameInvitation
    {
        $now = $this->clock->now();

        if ($this->invitations->hasPending($command->challengerId, $command->opponentId, $now)) {
            throw new DuplicatePendingInvitation('A pending invitation already exists for these players.');
        }

        $invitation = GameInvitation::create(
            $command->id,
            $command->challengerId,
            $command->opponentId,
            $command->colorPreference,
            $command->turnDuration,
            $now,
        );
        $this->invitations->save($invitation);

        return $invitation;
    }
}
