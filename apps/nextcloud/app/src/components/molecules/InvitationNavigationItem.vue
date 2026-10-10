<script setup lang="ts">
import type {
  InvitationNavigationItemProps,
  InvitationNavigationItemEvents,
} from '../../types/components';
import NcAvatar from '@nextcloud/vue/components/NcAvatar';
import NcAppNavigationItem from '@nextcloud/vue/components/NcAppNavigationItem';
import InvitationQuickActions from './InvitationQuickActions.vue';
defineProps<InvitationNavigationItemProps>();
const emit = defineEmits<InvitationNavigationItemEvents>();
</script>
<template>
  <NcAppNavigationItem
    :name="invitation.challengerName"
    :loading="loading"
    :active="active"
    @click="emit('select', invitation)"
  >
    <template #icon
      ><NcAvatar
        :user="invitation.challengerId"
        :display-name="invitation.challengerName"
        :size="32"
        :disable-menu="true"
        :disable-tooltip="true"
    /></template>
    <template #extra>
      <InvitationQuickActions
        :player-name="invitation.challengerName"
        :disabled="disabled"
        @respond="emit('respond', invitation, $event)"
      />
    </template>
  </NcAppNavigationItem>
</template>
