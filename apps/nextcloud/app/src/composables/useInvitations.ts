import { showSuccess, showError, showWarning } from '@nextcloud/dialogs';
import { onMounted, onScopeDispose, ref } from 'vue';
import type { ApiClient, CreateInvitation, Invitation } from '../api';
import { errorMessage } from '../lib/errors';

export function useInvitations(api: ApiClient) {
  const userId = ref('');
  const invitations = ref<Invitation[]>([]);
  const loading = ref(true);
  const refreshing = ref(false);
  const error = ref<string | null>(null);
  const notice = ref<string | null>(null);
  const busyInvitation = ref<string | null>(null);
  let loadSequence = 0;

  async function refresh(initial = false) {
    const sequence = ++loadSequence;
    if (initial) loading.value = true;
    else refreshing.value = true;
    error.value = null;
    try {
      const result = await api.listInvitations();
      if (sequence !== loadSequence) return;
      userId.value = result.userId;
      invitations.value = result.invitations;
    } catch (failure) {
      if (sequence === loadSequence) error.value = errorMessage(failure);
    } finally {
      if (sequence === loadSequence) {
        loading.value = false;
        refreshing.value = false;
      }
    }
  }

  onMounted(() => {
    void refresh(true);
  });
  onScopeDispose(() => {
    loadSequence++;
  });

  async function createInvitation(data: CreateInvitation): Promise<boolean> {
    error.value = null;
    notice.value = null;
    try {
      const result = await api.createInvitation(data);
      notice.value =
        result.warning ??
        `Einladung an ${result.invitation.opponentName} wurde gesendet.`;
      if (result.warning) showWarning(result.warning);
      else showSuccess(notice.value);
      await refresh();
      return true;
    } catch (failure) {
      error.value = errorMessage(failure);
      showError(error.value);
      return false;
    }
  }

  async function respondToInvitation(
    invitation: Invitation,
    action: 'accept' | 'decline',
  ) {
    busyInvitation.value = invitation.id;
    error.value = null;
    notice.value = null;
    try {
      const result =
        action === 'accept'
          ? await api.acceptInvitation(invitation.id)
          : await api.declineInvitation(invitation.id);
      notice.value =
        result.warning ??
        (action === 'accept'
          ? 'Einladung angenommen. Die Partie wurde angelegt.'
          : 'Einladung abgelehnt.');
      await refresh();
    } catch (failure) {
      error.value = errorMessage(failure);
      showError(error.value);
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
    notice,
    busyInvitation,
    refresh,
    createInvitation,
    respondToInvitation,
  };
}
