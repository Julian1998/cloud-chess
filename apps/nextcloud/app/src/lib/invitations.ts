import { t, getCanonicalLocale } from '@nextcloud/l10n';
import type { ColorPreference, Invitation, TurnDuration } from '../api';

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
  white: t('cloud_chess', 'White'),
  black: t('cloud_chess', 'Black'),
  random: t('cloud_chess', 'Randomly assigned'),
};
export const durationLabels: Record<TurnDuration, string> = {
  P1D: t('cloud_chess', '1 day per move'),
  P2D: t('cloud_chess', '2 days per move'),
};
export const statusLabels: Record<Invitation['status'], string> = {
  pending: t('cloud_chess', 'Awaiting reply'),
  accepted: t('cloud_chess', 'Accepted'),
  declined: t('cloud_chess', 'Declined'),
  cancelled: t('cloud_chess', 'Cancelled'),
  expired: t('cloud_chess', 'Expired'),
};

export function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(getCanonicalLocale(), {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
}
