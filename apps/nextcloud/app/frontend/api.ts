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

  public constructor(
    apiBase: string,
    private readonly requestToken: string,
  ) {
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
    let response: Response;

    try {
      response = await fetch(`${this.apiBase}${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          ...(body === undefined
            ? {}
            : {
                'Content-Type': 'application/json',
                requesttoken: this.requestToken,
              }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch {
      throw new Error(
        'Der Server ist nicht erreichbar. Bitte versuche es erneut.',
      );
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new Error('Die Serverantwort konnte nicht gelesen werden.');
    }

    if (!response.ok) {
      const error =
        typeof payload === 'object' &&
        payload !== null &&
        'error' in payload &&
        typeof payload.error === 'string'
          ? payload.error
          : `Die Anfrage ist fehlgeschlagen (${response.status}).`;
      throw new Error(error);
    }

    return payload as T;
  }
}
