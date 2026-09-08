<?php

declare(strict_types=1);

namespace CloudChess\Core\Application;

use CloudChess\Core\Domain\Game;
use CloudChess\Core\Domain\GameInvitation;
use CloudChess\Core\Domain\PlayerAssignment;
use CloudChess\Core\Ports\Clock;
use CloudChess\Core\Ports\ColorAssigner;
use CloudChess\Core\Ports\GameInvitationRepository;
use CloudChess\Core\Ports\GameRepository;
use CloudChess\Core\Ports\TransactionRunner;

final readonly class AcceptInvitation
{
    public function __construct(
        private GameInvitationRepository $invitations,
        private GameRepository $games,
        private ColorAssigner $colorAssigner,
        private Clock $clock,
        private TransactionRunner $transactions,
    ) {
    }

    public function __invoke(AcceptInvitationCommand $command): Game
    {
        /** @var Game */
        return $this->transactions->run(function () use ($command): Game {
            $invitation = $this->invitations->get($command->invitationId);
            $now = $this->clock->now();

            $invitation->accept($command->actorId, $now);
            $game = Game::start(
                $command->gameId,
                $this->assignPlayers($invitation),
                $invitation->turnDuration(),
                $now,
            );

            $this->invitations->save($invitation);
            $this->games->save($game);

            return $game;
        });
    }

    private function assignPlayers(GameInvitation $invitation): PlayerAssignment
    {
        return $this->colorAssigner->assign(
            $invitation->colorPreference(),
            $invitation->challengerId(),
            $invitation->opponentId(),
        );
    }
}
