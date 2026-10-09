<?php

declare(strict_types=1);

namespace OCA\CloudChess\Tests\Http;

use OCA\CloudChess\Tests\HttpClient;
use PHPUnit\Framework\TestCase;

use function array_column;
use function getenv;

final class InvitationHttpTest extends TestCase
{
    private static HttpClient $alice;
    private static HttpClient $bob;
    private static HttpClient $carla;
    private const INVITATION = [
        'opponentId' => 'chess_bob',
        'colorPreference' => 'white',
        'turnDuration' => 'P1D',
    ];

    public static function setUpBeforeClass(): void
    {
        $password = getenv('CLOUD_CHESS_DEMO_PASSWORD');
        self::assertNotEmpty($password, 'Set CLOUD_CHESS_DEMO_PASSWORD for the local demo accounts.');
        self::$alice = new HttpClient('chess_alice', $password);
        self::$bob = new HttpClient('chess_bob', $password);
        self::$carla = new HttpClient('chess_carla', $password);
    }

    protected function setUp(): void
    {
        parent::setUp();
        [$status, $result] = self::$bob->request('/invitations');
        self::assertSame(200, $status);

        // Resolve only pending invitations between the dedicated demo users; retain their history.
        foreach ($result['invitations'] as $invitation) {
            if ($invitation['challengerId'] === 'chess_alice'
                && $invitation['opponentId'] === 'chess_bob'
                && $invitation['status'] === 'pending') {
                self::assertSame(200, self::$bob->request('/invitations/' . $invitation['id'] . '/decline', [])[0]);
            }
        }
    }

    public function testRejectsMissingCsrfToken(): void
    {
        self::assertContains(self::$alice->request('/invitations', self::INVITATION, false)[0], [403, 412]);
    }

    public function testRejectsInvalidTurnDuration(): void
    {
        self::assertSame(400, self::$alice->request('/invitations', [
            ...self::INVITATION,
            'turnDuration' => 'P3D',
        ])[0]);
    }

    public function testUsesSessionActorAndRestrictsAccessToParticipants(): void
    {
        $invitation = $this->createInvitation(['actorId' => 'chess_carla']);
        self::assertSame('chess_alice', $invitation['challengerId']);
        $path = '/invitations/' . $invitation['id'];
        self::assertSame(404, self::$carla->request($path . '/accept', [])[0]);
        self::assertSame(404, self::$carla->request($path . '/decline', [])[0]);
        self::assertSame(404, self::$alice->request($path . '/accept', [])[0]);
        [$status, $result] = self::$carla->request('/invitations');
        self::assertSame(200, $status);
        self::assertNotContains($invitation['id'], array_column($result['invitations'], 'id'));
        self::assertSame(200, self::$bob->request($path . '/decline', [])[0]);
    }

    public function testRejectsDuplicateInvitationsAndRepeatedResponses(): void
    {
        $invitation = $this->createInvitation();
        $path = '/invitations/' . $invitation['id'];
        self::assertSame(409, self::$alice->request('/invitations', self::INVITATION)[0]);
        self::assertSame(200, self::$bob->request($path . '/accept', [])[0]);
        self::assertSame(409, self::$bob->request($path . '/accept', [])[0]);
        self::assertSame(409, self::$bob->request($path . '/decline', [])[0]);
    }

    private function createInvitation(array $extra = []): array
    {
        [$status, $result] = self::$alice->request('/invitations', [...self::INVITATION, ...$extra]);
        self::assertSame(201, $status);

        return $result['invitation'];
    }
}
