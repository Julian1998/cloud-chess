// @vitest-environment jsdom
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import axios from '@nextcloud/axios';
import { ApiClient } from '../api';
import { useInvitationsStore } from './invitations';
import { useGamesStore } from './games';
import { useNavigationStore } from './navigation';
import type { Invitation } from '../types/invitations';

beforeEach(() => setActivePinia(createPinia()));
afterEach(() => vi.restoreAllMocks());

const invitation: Invitation = {
  id: 'invite-1',
  challengerId: 'alice',
  challengerName: 'Alice',
  opponentId: 'bob',
  opponentName: 'Bob',
  colorPreference: 'white',
  turnDuration: 'P1D',
  status: 'pending',
  createdAt: '2026-10-09T10:00:00Z',
  expiresAt: '2026-10-16T10:00:00Z',
  game: null,
};

it('coalesces overlapping refreshes and ignores a response after cancellation', async () => {
  let resolve!: (value: { data: { userId: string; invitations: [] } }) => void;
  const pending = new Promise<{ data: { userId: string; invitations: [] } }>(
    (done) => {
      resolve = done;
    },
  );
  const get = vi.spyOn(axios, 'get').mockReturnValueOnce(pending);
  const store = useInvitationsStore();
  store.configure(new ApiClient('/api'));
  const first = store.refresh();
  const second = store.refresh('poll');
  expect(get).toHaveBeenCalledTimes(1);
  store.cancelRequests();
  resolve({ data: { userId: 'stale', invitations: [] } });
  await Promise.all([first, second]);
  expect(store.userId).toBe('');
});

it('keeps existing records and action errors on a failed background refresh', async () => {
  vi.spyOn(axios, 'get')
    .mockResolvedValueOnce({ data: { userId: 'bob', invitations: [] } })
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({ data: { userId: 'bob', invitations: [] } });
  const store = useInvitationsStore();
  store.configure(new ApiClient('/api'));
  await store.refresh();
  store.invitations = [invitation];
  store.error = 'action failed';
  await store.refresh('poll');
  expect(store.userId).toBe('bob');
  expect(store.invitations).toEqual([invitation]);
  expect(store.error).toBe('action failed');
  expect(store.syncError).toBeTruthy();
  await store.refresh('poll');
  expect(store.syncError).toBeNull();
  expect(store.error).toBe('action failed');
});

it('invalidates a pending poll before a mutation and blocks polling during the mutation', async () => {
  const accepted: Invitation = {
    ...invitation,
    status: 'accepted',
    game: {
      id: 'game-1',
      whitePlayerId: 'alice',
      blackPlayerId: 'bob',
      turnDeadline: '2026-10-11T10:00:00Z',
    },
  };
  let resolvePoll!: (value: {
    data: { userId: string; invitations: Invitation[] };
  }) => void;
  let resolveMutation!: (value: { data: { invitation: Invitation } }) => void;
  const poll = new Promise<{
    data: { userId: string; invitations: Invitation[] };
  }>((done) => {
    resolvePoll = done;
  });
  const mutation = new Promise<{ data: { invitation: Invitation } }>((done) => {
    resolveMutation = done;
  });
  const get = vi
    .spyOn(axios, 'get')
    .mockReturnValueOnce(poll)
    .mockResolvedValueOnce({
      data: { userId: 'bob', invitations: [accepted] },
    });
  const post = vi.spyOn(axios, 'post').mockReturnValueOnce(mutation);
  const store = useInvitationsStore();
  store.configure(new ApiClient('/api'));
  const background = store.refresh('poll');
  const response = store.respondToInvitation(invitation, 'accept');
  await store.refresh('poll');
  expect(get).toHaveBeenCalledTimes(1);
  expect(await store.respondToInvitation(invitation, 'decline')).toBeNull();
  expect(post).toHaveBeenCalledTimes(1);
  resolveMutation({ data: { invitation: accepted } });
  expect(await response).toEqual({ invitation: accepted });
  expect(store.lastMutation).toEqual({ invitation: accepted });
  expect(useNavigationStore().view).toBe('received');
  resolvePoll({ data: { userId: 'bob', invitations: [invitation] } });
  await background;
  expect(store.invitations).toEqual([accepted]);
  expect(useGamesStore().games).toEqual([accepted.game]);
});

it('composes game summaries and navigation without duplicating invitation records', () => {
  const invitations = useInvitationsStore();
  const games = useGamesStore();
  const navigation = useNavigationStore();
  invitations.userId = 'bob';
  invitations.invitations = [invitation];
  expect(games.games).toEqual([]);
  expect(navigation.selected).toEqual(invitation);
  navigation.view = 'games';
  navigation.selectedId = null;
  expect(navigation.visibleInvitations).toEqual([]);
  const accepted: Invitation = {
    ...invitation,
    status: 'accepted',
    game: {
      id: invitation.id,
      whitePlayerId: 'alice',
      blackPlayerId: 'bob',
      turnDeadline: invitation.expiresAt,
    },
  };
  invitations.invitations = [accepted];
  expect(games.games).toEqual([accepted.game]);
  expect(navigation.visibleInvitations[0]).toBe(invitations.invitations[0]);
  navigation.selectedId = accepted.id;
  expect(navigation.selected).toEqual(accepted);
  invitations.invitations = [];
  expect(games.games).toEqual([]);
  expect(navigation.selected).toBeUndefined();
  expect(navigation.visibleInvitations).toEqual([]);
});
