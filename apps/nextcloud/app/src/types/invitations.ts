import type { Game } from './games';

export type ColorPreference = 'white' | 'black' | 'random';
export type TurnDuration = 'P1D' | 'P2D';
export type InvitationStatus =
  'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';

export type User = {
  id: string;
  displayName: string;
};

export type Invitation = {
  id: string;
  challengerId: string;
  challengerName: string;
  opponentId: string;
  opponentName: string;
  colorPreference: ColorPreference;
  turnDuration: TurnDuration;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
  game: Game | null;
};

export type InvitationList = {
  userId: string;
  invitations: Invitation[];
};

export type InvitationMutation = {
  invitation: Invitation;
  warning?: string;
};

export type CreateInvitation = {
  opponentId: string;
  opponentSearch?: string;
  colorPreference: ColorPreference;
  turnDuration: TurnDuration;
};

export type InvitationAction = 'accept' | 'decline';

export type GameInvitation = Invitation & { game: Game };
