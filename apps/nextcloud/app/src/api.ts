import { t } from '@nextcloud/l10n';
import axios, { isAxiosError } from '@nextcloud/axios';
import { generateUrl } from '@nextcloud/router';

export type ColorPreference = 'white' | 'black' | 'random';
export type TurnDuration = 'P1D' | 'P2D';
export type InvitationStatus =
  'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';

export type User = {
  id: string;
  displayName: string;
};

export type Game = {
  id: string;
  whitePlayerId: string;
  blackPlayerId: string;
  turnDeadline: string;
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

export class ApiClient {
  private readonly apiBase: string;

  public constructor(apiBase = generateUrl('/apps/cloud_chess/api')) {
    this.apiBase = apiBase.replace(/\/$/, '');
  }

  public listInvitations(): Promise<InvitationList> {
    return this.request('/invitations');
  }

  public searchUsers(search: string): Promise<{ users: User[] }> {
    return this.request(`/users?search=${encodeURIComponent(search)}`);
  }

  public createInvitation(data: CreateInvitation): Promise<InvitationMutation> {
    return this.request('/invitations', data);
  }

  public acceptInvitation(id: string): Promise<InvitationMutation> {
    return this.request(`/invitations/${encodeURIComponent(id)}/accept`, {});
  }

  public declineInvitation(id: string): Promise<InvitationMutation> {
    return this.request(`/invitations/${encodeURIComponent(id)}/decline`, {});
  }

  private async request<T>(path: string, body?: object): Promise<T> {
    try {
      const response =
        body === undefined
          ? await axios.get<T>(`${this.apiBase}${path}`)
          : await axios.post<T>(`${this.apiBase}${path}`, body);
      return response.data;
    } catch (failure) {
      if (isAxiosError(failure) && failure.response) {
        const payload: unknown = failure.response.data;
        const message =
          typeof payload === 'object' &&
          payload !== null &&
          'error' in payload &&
          typeof payload.error === 'string'
            ? payload.error
            : t('cloud_chess', 'The request failed ({status}).', {
                status: failure.response.status,
              });
        throw new Error(message);
      }
      throw new Error(
        t('cloud_chess', 'The server is unreachable. Please try again.'),
      );
    }
  }
}
