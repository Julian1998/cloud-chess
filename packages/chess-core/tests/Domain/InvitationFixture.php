<?php

declare(strict_types=1);

namespace CloudChess\Core\Tests\Domain;

use CloudChess\Core\Domain\ColorPreference;
use CloudChess\Core\Domain\GameInvitation;
use CloudChess\Core\Domain\GameInvitationId;
use CloudChess\Core\Domain\PlayerId;
use CloudChess\Core\Domain\TurnDuration;
use DateTimeImmutable;

final class InvitationFixture
{
    public static function pending(): GameInvitation
    {
        return GameInvitation::create(
            GameInvitationId::fromString('invitation-1'),
            PlayerId::fromString('challenger'),
            PlayerId::fromString('opponent'),
            ColorPreference::RANDOM,
            TurnDuration::ONE_DAY,
            new DateTimeImmutable('2026-09-08T10:00:00+00:00'),
        );
    }

    public static function challenger(): PlayerId
    {
        return PlayerId::fromString('challenger');
    }

    public static function opponent(): PlayerId
    {
        return PlayerId::fromString('opponent');
    }
}
