<?php

declare(strict_types=1);

namespace CloudChess\Core\Tests\Domain;

use CloudChess\Core\Domain\GameId;
use CloudChess\Core\Domain\GameInvitationId;
use CloudChess\Core\Domain\PlayerId;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class IdentifierTest extends TestCase
{
    #[DataProvider('identifiers')]
    public function test_preserves_a_non_empty_identifier(string $className): void
    {
        $identifier = $className::fromString('id-1');

        self::assertSame('id-1', $identifier->toString());
    }

    #[DataProvider('identifiers')]
    public function test_rejects_an_empty_identifier(string $className): void
    {
        $this->expectException(InvalidArgumentException::class);

        $className::fromString('');
    }

    /** @return array<string, array{class-string<PlayerId|GameId|GameInvitationId>}> */
    public static function identifiers(): array
    {
        return [
            'player' => [PlayerId::class],
            'game' => [GameId::class],
            'invitation' => [GameInvitationId::class],
        ];
    }
}
