<?php

declare(strict_types=1);

namespace CloudChess\Core\Tests\Application;

use CloudChess\Core\Tests\Domain\InvitationFixture;
use PHPUnit\Framework\TestCase;

final class InMemoryGameInvitationRepositoryTest extends TestCase
{
    public function test_retrieves_a_saved_invitation_by_id(): void
    {
        $repository = new InMemoryGameInvitationRepository();
        $invitation = InvitationFixture::pending();

        $repository->save($invitation);

        self::assertSame($invitation, $repository->get($invitation->id()));
    }

    public function test_knows_when_a_pending_invitation_exists_in_one_direction(): void
    {
        $repository = new InMemoryGameInvitationRepository();
        $repository->save(InvitationFixture::pending());

        self::assertTrue($repository->hasPending(InvitationFixture::challenger(), InvitationFixture::opponent()));
        self::assertFalse($repository->hasPending(InvitationFixture::opponent(), InvitationFixture::challenger()));
    }
}
