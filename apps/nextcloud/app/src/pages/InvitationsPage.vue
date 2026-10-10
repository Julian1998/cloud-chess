<script setup lang="ts">
import AppIcon from '../components/atoms/AppIcon.vue';
import { translate } from '../platform/i18n';
import NcButton from '@nextcloud/vue/components/NcButton';
import InvitationCard from '../components/organisms/InvitationCard.vue';
import InvitationList from '../components/organisms/InvitationList.vue';
import InvitationTabs from '../components/molecules/InvitationTabs.vue';
import PageTemplate from '../templates/PageTemplate.vue';
import { storeToRefs } from 'pinia';
import { useNavigationStore } from '../stores/navigation';
import { useInvitationsStore } from '../stores/invitations';
import { computed } from 'vue';
import { useNavigation } from '../composables/useNavigation';
const navigation = useNavigationStore();
const invitations = useInvitationsStore();
const {
  userId,
  loading,
  refreshing,
  error,
  syncError,
  lastMutation,
  busyInvitation,
} = storeToRefs(invitations);
const { composing, view, selectedId, selected, visibleInvitations } =
  storeToRefs(navigation);
const { navigate, compose, respond } = useNavigation();
const title = computed(() =>
  view.value === 'games' ? translate('All games') : translate('Invitations'),
);
const description = computed(
  () =>
    ({
      received: translate('Reply to a challenge or invite someone to play.'),
      sent: translate('Invite someone and choose your time per move.'),
      games: translate('Your accepted challenges and game details.'),
      history: translate('Previous invitations, all in one place.'),
    })[view.value],
);
const pageError = computed(() => {
  const message = error.value ?? syncError.value;
  return composing.value || !message ? null : translate(message);
});
const notice = computed(() => {
  const result = lastMutation.value;
  if (!result) return null;
  if (result.warning) return result.warning;
  switch (result.invitation.status) {
    case 'pending':
      return translate('Invitation sent to {player}.', {
        player: result.invitation.opponentName,
      });
    case 'accepted':
      return translate(
        'The invitation was accepted. The game has been created.',
      );
    case 'declined':
      return translate('The invitation was declined.');
    default:
      return null;
  }
});
</script>
<template>
  <PageTemplate
    :title="title"
    :description="description"
    :refreshing="refreshing"
    :loading="loading"
    :error="pageError"
    :notice="composing ? null : notice"
    @refresh="invitations.refresh()"
  >
    <template #tabs
      ><InvitationTabs
        v-if="view !== 'games'"
        :view="view"
        @navigate="navigate"
    /></template>
    <template v-if="selected">
      <NcButton
        class="chess-back"
        variant="tertiary"
        @click="selectedId = null"
      >
        <template #icon><AppIcon name="back" /></template>
        {{ translate('Back to {view}', { view: title }) }}
      </NcButton>
      <InvitationCard
        :invitation="selected"
        :received="selected.opponentId === userId"
        :busy="busyInvitation !== null"
        @accept="respond(selected, 'accept')"
        @decline="respond(selected, 'decline')"
      />
    </template>
    <div v-else class="chess-sections">
      <InvitationList
        :invitations="visibleInvitations"
        :user-id="userId"
        :kind="view"
        :loading="loading"
        :busy-invitation="busyInvitation"
        @select="selectedId = $event.id"
        @compose="compose"
        @respond="respond"
      />
    </div>
  </PageTemplate>
</template>
