import { translate } from '../platform/i18n';
import type {
  ColorPreference,
  Invitation,
  TurnDuration,
} from '../types/invitations';

export function splitInvitations(invitations: Invitation[], userId: string) {
  return {
    received: invitations.filter(
      ({ opponentId, status }) => opponentId === userId && status === 'pending',
    ),
    sent: invitations.filter(
      ({ challengerId, status }) =>
        challengerId === userId && status === 'pending',
    ),
    games: invitations.filter(({ game }) => game !== null),
    history: invitations.filter(
      ({ status, game }) => status !== 'pending' && game === null,
    ),
  };
}

export function playerColor(
  invitation: Invitation,
  userId: string,
): ColorPreference {
  if (invitation.game)
    return invitation.game.whitePlayerId === userId ? 'white' : 'black';
  if (
    invitation.challengerId === userId ||
    invitation.colorPreference === 'random'
  )
    return invitation.colorPreference;
  return invitation.colorPreference === 'white' ? 'black' : 'white';
}

export const colorLabels: Record<ColorPreference, string> = {
  white: translate('White'),
  black: translate('Black'),
  random: translate('Randomly assigned'),
};
export const durationLabels: Record<TurnDuration, string> = {
  P1D: translate('1 day per move'),
  P2D: translate('2 days per move'),
};
export const statusLabels: Record<Invitation['status'], string> = {
  pending: translate('Awaiting reply'),
  accepted: translate('Accepted'),
  declined: translate('Declined'),
  cancelled: translate('Cancelled'),
  expired: translate('Expired'),
};
