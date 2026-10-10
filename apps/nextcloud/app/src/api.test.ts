// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.hoisted(() => {
  document.head.dataset.requesttoken = 'csrf-token';
});
import axios from '@nextcloud/axios';
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

const originalAdapter = axios.defaults.adapter;
afterEach(() => {
  axios.defaults.adapter = originalAdapter;
});
describe('ApiClient', () => {
  it('uses the Nextcloud client JSON and CSRF headers for mutations', async () => {
    const adapter = vi.fn(async (config) => ({
      data: { invitation },
      status: 201,
      statusText: 'Created',
      headers: {},
      config,
    }));
    axios.defaults.adapter = adapter;
    const result = await new ApiClient(
      '/index.php/apps/chess/api',
    ).createInvitation({
      opponentId: 'bob',
      colorPreference: 'white',
      turnDuration: 'P1D',
    });
    expect(result.invitation.id).toBe('invite-1');
    const config = adapter.mock.calls[0][0];
    expect(config.url).toBe('/index.php/apps/chess/api/invitations');
    expect(config.method).toBe('post');
    expect(config.headers.get('requesttoken')).toBe('csrf-token');
    expect(config.headers.get('Content-Type')).toBe('application/json');
    expect(JSON.parse(config.data)).toEqual({
      opponentId: 'bob',
      colorPreference: 'white',
      turnDuration: 'P1D',
    });
  });
  it('surfaces a server error message for an unsuccessful request', async () => {
    axios.defaults.adapter = async () => {
      throw {
        isAxiosError: true,
        response: { status: 409, data: { error: 'Einladung ist abgelaufen.' } },
      };
    };
    await expect(
      new ApiClient('/api').acceptInvitation('invite-1'),
    ).rejects.toThrow('Einladung ist abgelaufen.');
  });
  it('turns a failed connection into an actionable message', async () => {
    axios.defaults.adapter = async () => {
      throw new TypeError('offline');
    };
    await expect(new ApiClient('/api/').listInvitations()).rejects.toThrow(
      'Der Server ist nicht erreichbar. Bitte versuche es erneut.',
    );
  });
});
