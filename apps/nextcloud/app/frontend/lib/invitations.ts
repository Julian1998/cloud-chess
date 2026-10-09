import type { Invitation } from '../api';

type InvitationGroups = {
  received: Invitation[];
  sent: Invitation[];
};

export type InvitationTab = keyof InvitationGroups;

export function splitInvitations(
  invitations: Invitation[],
  userId: string,
): InvitationGroups {
  return {
    received: invitations.filter(({ opponentId }) => opponentId === userId),
    sent: invitations.filter(({ challengerId }) => challengerId === userId),
  };
}
