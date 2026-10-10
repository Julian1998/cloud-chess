<script setup lang="ts">
import type {
  InvitationQuickActionsProps,
  InvitationQuickActionsEvents,
} from '../../types/components';
import AppIcon from '../atoms/AppIcon.vue';
import { translate } from '../../platform/i18n';
import NcButton from '@nextcloud/vue/components/NcButton';
defineProps<InvitationQuickActionsProps>();
const emit = defineEmits<InvitationQuickActionsEvents>();
</script>
<template>
  <div class="chess-invite-quick-actions">
    <NcButton
      variant="tertiary"
      class="chess-invite-accept"
      :aria-label="`${translate('Accept')}: ${playerName}`"
      :title="translate('Accept')"
      :disabled="disabled"
      @click.stop="emit('respond', 'accept')"
    >
      <template #icon><AppIcon name="accept" /></template>
    </NcButton>
    <NcButton
      variant="tertiary"
      class="chess-invite-decline"
      :aria-label="`${translate('Decline')}: ${playerName}`"
      :title="translate('Decline')"
      :disabled="disabled"
      @click.stop="emit('respond', 'decline')"
    >
      <template #icon><AppIcon name="decline" /></template>
    </NcButton>
  </div>
</template>

<style>
.chess-invite-quick-actions {
  display: flex;
  flex-shrink: 0;
}

.chess-invite-accept {
  color: var(--color-success-text) !important;
}

.chess-invite-decline {
  color: var(--color-error-text) !important;
}
</style>
