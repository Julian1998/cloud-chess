import { describe, expect, it } from 'vitest';

import type { Invitation } from '../api';
import { splitInvitations } from './invitations';

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
    });
  });
});
