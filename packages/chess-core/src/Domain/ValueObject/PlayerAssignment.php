<?php

declare(strict_types=1);

namespace CloudChess\Core\Domain\ValueObject;

use DomainException;

final readonly class PlayerAssignment
{
    private function __construct(
        private PlayerId $whitePlayerId,
        private PlayerId $blackPlayerId,
    ) {
    }

    public static function withWhiteAndBlack(PlayerId $whitePlayerId, PlayerId $blackPlayerId): self
    {
        if ($whitePlayerId->toString() === $blackPlayerId->toString()) {
            throw new DomainException('White and black players must differ.');
        }

        return new self($whitePlayerId, $blackPlayerId);
    }

    public function whitePlayerId(): PlayerId
    {
        return $this->whitePlayerId;
    }

    public function blackPlayerId(): PlayerId
    {
        return $this->blackPlayerId;
    }
}
