import { translate } from './platform/i18n';
import axios, { isAxiosError } from '@nextcloud/axios';
import { generateUrl } from '@nextcloud/router';

import type {
  InvitationList,
  InvitationMutation,
  CreateInvitation,
  User,
} from './types/invitations';

export class ApiClient {
  private readonly apiBase: string;

  public constructor(apiBase = generateUrl('/apps/chess/api')) {
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
            : translate('The request failed ({status}).', {
                status: failure.response.status,
              });
        throw new Error(message);
      }
      throw new Error(
        translate('The server is unreachable. Please try again.'),
      );
    }
  }
}
