<script setup lang="ts">
import type {
  InvitationResponseActionsProps,
  InvitationResponseActionsEvents,
} from '../../types/components';
import { translate } from '../../platform/i18n';
import NcButton from '@nextcloud/vue/components/NcButton';
import NcLoadingIcon from '@nextcloud/vue/components/NcLoadingIcon';
defineProps<InvitationResponseActionsProps>();
const emit = defineEmits<InvitationResponseActionsEvents>();
</script>
<template>
  <div class="chess-response-actions">
    <NcButton
      variant="primary"
      :disabled="disabled"
      @click.stop="emit('accept')"
    >
      <template v-if="busy" #icon><NcLoadingIcon /></template>
      {{ busy ? translate('Processing …') : translate('Accept') }}
    </NcButton>
    <NcButton
      variant="tertiary"
      :disabled="disabled"
      @click.stop="emit('decline')"
      >{{ translate('Decline') }}</NcButton
    >
  </div>
</template>

<style>
.chess-response-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
