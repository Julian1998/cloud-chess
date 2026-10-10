<script setup lang="ts">
import type {
  InvitationTabsProps,
  InvitationTabsEvents,
} from '../../types/components';
import { translate } from '../../platform/i18n';
import NcButton from '@nextcloud/vue/components/NcButton';
defineProps<InvitationTabsProps>();
const emit = defineEmits<InvitationTabsEvents>();
</script>
<template>
  <nav class="chess-invitation-tabs" :aria-label="translate('Invitations')">
    <NcButton
      v-for="tab in [
        { id: 'received' as const, label: translate('Received') },
        { id: 'sent' as const, label: translate('Sent') },
        { id: 'history' as const, label: translate('History') },
      ]"
      :key="tab.id"
      :variant="view === tab.id ? 'secondary' : 'tertiary'"
      :aria-pressed="view === tab.id"
      @click="emit('navigate', tab.id)"
      >{{ tab.label }}</NcButton
    >
  </nav>
</template>

<style>
.chess-invitation-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 28px;
}
</style>
