import { describe, expect, it } from 'vitest';

import type { Invitation } from '../types/invitations';
import { splitInvitations, playerColor } from './invitations';

const baseInvitation: Invitation = {
  id: 'invite-1',
  challengerId: 'alice',
  challengerName: 'Alice',
  opponentId: 'bob',
  opponentName: 'Bob',
  colorPreference: 'random',
  turnDuration: 'P1D',
  status: 'pending',
  createdAt: '2026-09-12T10:00:00+00:00',
  expiresAt: '2026-09-19T10:00:00+00:00',
  game: null,
};

describe('splitInvitations', () => {
  it('separates received and sent invitations for the signed-in user', () => {
    const received = { ...baseInvitation, id: 'received' };
    const sent = {
      ...baseInvitation,
      id: 'sent',
      challengerId: 'bob',
      challengerName: 'Bob',
      opponentId: 'alice',
      opponentName: 'Alice',
    };

    expect(splitInvitations([received, sent], 'bob')).toEqual({
      received: [received],
      sent: [sent],
      games: [],
      history: [],
    });
  });
});

it('keeps resolved invitations out of the inbox and separates games from history', () => {
  const accepted: Invitation = {
    ...baseInvitation,
    id: 'game',
    status: 'accepted',
    game: {
      id: 'game',
      whitePlayerId: 'alice',
      blackPlayerId: 'bob',
      turnDeadline: '2026-10-11T10:00:00Z',
    },
  };
  const declined: Invitation = {
    ...baseInvitation,
    id: 'declined',
    status: 'declined',
  };
  const expired: Invitation = {
    ...baseInvitation,
    id: 'expired',
    status: 'expired',
  };
  expect(
    splitInvitations([baseInvitation, accepted, declined, expired], 'bob'),
  ).toEqual({
    received: [baseInvitation],
    sent: [],
    games: [accepted],
    history: [declined, expired],
  });
});

it('shows the receiving player’s color and uses assigned colors once a game exists', () => {
  const white: Invitation = { ...baseInvitation, colorPreference: 'white' };
  expect(playerColor(white, 'bob')).toBe('black');
  expect(playerColor(white, 'alice')).toBe('white');
  expect(playerColor(baseInvitation, 'bob')).toBe('random');
  expect(
    playerColor(
      {
        ...white,
        game: {
          id: white.id,
          whitePlayerId: 'bob',
          blackPlayerId: 'alice',
          turnDeadline: white.expiresAt,
        },
      },
      'bob',
    ),
  ).toBe('white');
});
