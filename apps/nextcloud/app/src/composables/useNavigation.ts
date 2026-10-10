import { showSuccess, showError, showWarning } from '@nextcloud/dialogs';
import { translate } from '../platform/i18n';
import { emit } from '@nextcloud/event-bus';
import { useIsMobile } from '@nextcloud/vue/composables/useIsMobile';
import { useNavigationStore } from '../stores/navigation';
import { useInvitationsStore } from '../stores/invitations';
import type {
  Invitation,
  InvitationAction,
  CreateInvitation,
} from '../types/invitations';
import type { InvitationsView } from '../types/navigation';

export function useNavigation() {
  const navigation = useNavigationStore();
  const invitations = useInvitationsStore();
  const isMobile = useIsMobile();
  function close() {
    if (isMobile.value) emit('toggle-navigation', { open: false });
  }
  function navigate(view: InvitationsView) {
    navigation.view = view;
    navigation.selectedId = null;
    close();
  }
  function selectIncoming(invitation: Invitation) {
    navigation.view = 'received';
    navigation.selectedId = invitation.id;
    close();
  }
  function openSettings() {
    navigation.settingsOpen = true;
    close();
  }
  function quickRespond(invitation: Invitation, action: InvitationAction) {
    void respond(invitation, action);
    close();
  }
  async function handleCreate(data: CreateInvitation) {
    if (invitations.mutating) return false;
    const result = await invitations.createInvitation(data);
    if (!result) {
      if (invitations.error) showError(translate(invitations.error));
      return false;
    }
    if (result.warning) showWarning(result.warning);
    else
      showSuccess(
        translate('Invitation sent to {player}.', {
          player: result.invitation.opponentName,
        }),
      );
    navigation.composing = false;
    navigate('sent');
    return true;
  }
  function compose() {
    invitations.error = null;
    navigation.composing = true;
  }
  async function respond(invitation: Invitation, action: InvitationAction) {
    if (invitations.mutating) return;
    const result = await invitations.respondToInvitation(invitation, action);
    if (!result) {
      if (invitations.error) showError(translate(invitations.error));
      return;
    }
    navigation.selectedId = invitations.incoming[0]?.id ?? null;
    if (action === 'accept') {
      navigation.view = 'games';
      navigation.selectedId = result.invitation.game
        ? result.invitation.id
        : null;
    }
  }
  return {
    navigate,
    selectIncoming,
    openSettings,
    quickRespond,
    handleCreate,
    compose,
    respond,
  };
}
