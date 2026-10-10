import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { ApiClient } from '../api';
import type {
  CreateInvitation,
  Invitation,
  InvitationAction,
  InvitationMutation,
} from '../types/invitations';
import type { RefreshMode } from '../types/sync';
import { splitInvitations } from '../lib/invitations';
import { errorMessage } from '../lib/errors';

export const useInvitationsStore = defineStore('invitations', () => {
  const userId = ref('');
  const invitations = ref<Invitation[]>([]);
  const loading = ref(true);
  const refreshing = ref(false);
  const error = ref<string | null>(null);
  const syncError = ref<string | null>(null);
  const lastMutation = ref<InvitationMutation | null>(null);
  const busyInvitation = ref<string | null>(null);
  const mutating = ref(false);
  const groups = computed(() =>
    splitInvitations(invitations.value, userId.value),
  );
  const incoming = computed(() =>
    [...groups.value.received].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    ),
  );
  const sent = computed(() => groups.value.sent);
  const history = computed(() => groups.value.history);
  let api = new ApiClient();
  let revision = 0;
  let pending: Promise<boolean> | null = null;

  function configure(client: ApiClient) {
    api = client;
  }
  function cancelRequests() {
    revision++;
    pending = null;
    loading.value = false;
    refreshing.value = false;
  }
  async function load(mode: RefreshMode, current: number) {
    try {
      const result = await api.listInvitations();
      if (current !== revision) return false;
      userId.value = result.userId;
      invitations.value = result.invitations;
      syncError.value = null;
      return true;
    } catch (failure) {
      if (current === revision) {
        if (mode === 'poll') syncError.value = errorMessage(failure);
        else error.value = errorMessage(failure);
      }
      return false;
    } finally {
      if (current === revision) {
        loading.value = false;
        refreshing.value = false;
      }
    }
  }
  async function refresh(mode: RefreshMode = 'manual'): Promise<boolean> {
    if (mutating.value && mode !== 'mutation') return false;
    if (pending) return pending;
    if (mode !== 'poll') error.value = null;
    refreshing.value = mode !== 'poll' && !loading.value;
    const request = load(mode, ++revision);
    pending = request;
    try {
      return await request;
    } finally {
      if (pending === request) pending = null;
    }
  }
  async function mutate(operation: () => Promise<InvitationMutation>) {
    if (mutating.value) return null;
    cancelRequests();
    mutating.value = true;
    error.value = null;
    lastMutation.value = null;
    try {
      const result = await operation();
      invitations.value = [
        result.invitation,
        ...invitations.value.filter(({ id }) => id !== result.invitation.id),
      ];
      lastMutation.value = result;
      await refresh('mutation');
      return result;
    } catch (failure) {
      error.value = errorMessage(failure);
      return null;
    } finally {
      mutating.value = false;
    }
  }
  function createInvitation(data: CreateInvitation) {
    return mutate(() => api.createInvitation(data));
  }
  async function respondToInvitation(
    invitation: Invitation,
    action: InvitationAction,
  ) {
    if (mutating.value) return null;
    busyInvitation.value = invitation.id;
    try {
      return await mutate(() =>
        action === 'accept'
          ? api.acceptInvitation(invitation.id)
          : api.declineInvitation(invitation.id),
      );
    } finally {
      busyInvitation.value = null;
    }
  }
  return {
    userId,
    invitations,
    loading,
    refreshing,
    error,
    syncError,
    lastMutation,
    busyInvitation,
    mutating,
    incoming,
    sent,
    history,
    configure,
    cancelRequests,
    refresh,
    createInvitation,
    respondToInvitation,
  };
});
