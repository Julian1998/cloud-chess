import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiClient } from './api';

const invitation = {
  id: 'invite-1',
  challengerId: 'alice',
  challengerName: 'Alice',
  opponentId: 'bob',
  opponentName: 'Bob',
  colorPreference: 'white' as const,
  turnDuration: 'P1D' as const,
  status: 'pending' as const,
  createdAt: '2026-09-12T10:00:00+00:00',
  expiresAt: '2026-09-19T10:00:00+00:00',
  game: null,
};

afterEach(() => vi.unstubAllGlobals());

describe('ApiClient', () => {
  it('sends JSON mutations with the Nextcloud request token', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(JSON.stringify({ invitation }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetch);

    const result = await new ApiClient(
      '/index.php/apps/cloud_chess/api',
      'csrf-token',
    ).createInvitation({
      opponentId: 'bob',
      colorPreference: 'white',
      turnDuration: 'P1D',
    });

    expect(result.invitation.id).toBe('invite-1');
    expect(fetch).toHaveBeenCalledWith(
      '/index.php/apps/cloud_chess/api/invitations',
      {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          requesttoken: 'csrf-token',
        },
        body: JSON.stringify({
          opponentId: 'bob',
          colorPreference: 'white',
          turnDuration: 'P1D',
        }),
      },
    );
  });

  it('surfaces a server error message for an unsuccessful request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof globalThis.fetch>().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Einladung ist abgelaufen.' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    await expect(
      new ApiClient('/api', 'token').acceptInvitation('invite-1'),
    ).rejects.toThrow('Einladung ist abgelaufen.');
  });

  it('turns a failed connection into an actionable message', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof globalThis.fetch>()
        .mockRejectedValue(new TypeError('offline')),
    );

    await expect(
      new ApiClient('/api/', 'token').listInvitations(),
    ).rejects.toThrow(
      'Der Server ist nicht erreichbar. Bitte versuche es erneut.',
    );
  });
});
