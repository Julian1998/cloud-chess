<?php

declare(strict_types=1);

namespace CloudChess\Core\Tests\Domain;

use CloudChess\Core\Domain\Aggregate\GameInvitation;
use CloudChess\Core\Domain\Enum\ColorPreference;
use CloudChess\Core\Domain\Enum\TurnDuration;
use CloudChess\Core\Domain\ValueObject\GameInvitationId;
use CloudChess\Core\Domain\ValueObject\PlayerId;
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
