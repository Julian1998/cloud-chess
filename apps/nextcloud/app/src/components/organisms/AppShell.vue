<script setup lang="ts">
import { translate } from '../../platform/i18n';
import type { AppShellProps } from '../../types/components';
import NcAppContent from '@nextcloud/vue/components/NcAppContent';
import { storeToRefs } from 'pinia';
import { useNavigationStore } from '../../stores/navigation';
import { useInvitationsStore } from '../../stores/invitations';
import { useNavigation } from '../../composables/useNavigation';
import { useServerPolling } from '../../composables/useServerPolling';
import SidebarNavigation from './SidebarNavigation.vue';
import AppSettingsDialog from './AppSettingsDialog.vue';
import InvitationForm from './InvitationForm.vue';

const props = defineProps<AppShellProps>();
const navigation = useNavigationStore();
const invitations = useInvitationsStore();
invitations.configure(props.api);
useServerPolling();
const { incoming, loading, busyInvitation, error } = storeToRefs(invitations);
const { view, selected, inboxOpen, settingsOpen, composing } =
  storeToRefs(navigation);
const {
  navigate,
  selectIncoming,
  quickRespond,
  openSettings,
  handleCreate,
  compose,
} = useNavigation();
</script>
<template>
  <SidebarNavigation
    v-model:inbox-open="inboxOpen"
    :view="view"
    :selected-id="selected?.id"
    :incoming="incoming"
    :loading="loading"
    :busy-invitation="busyInvitation"
    @navigate="navigate"
    @select="selectIncoming"
    @compose="compose"
    @settings="openSettings"
    @respond="quickRespond"
  />
  <NcAppContent><slot /></NcAppContent>
  <AppSettingsDialog
    v-model:open="settingsOpen"
    v-model:inbox-open="inboxOpen"
  />
  <InvitationForm
    v-if="composing"
    :api="api"
    :on-create="handleCreate"
    :error="error ? translate(error) : null"
    @close="composing = false"
  />
</template>
