<script setup lang="ts">
import type {
  InvitationListProps,
  InvitationListEvents,
} from '../../types/components';
import AppIcon from '../atoms/AppIcon.vue';
import { translate } from '../../platform/i18n';
import { computed, useId } from 'vue';
import NcCounterBubble from '@nextcloud/vue/components/NcCounterBubble';
import NcEmptyContent from '@nextcloud/vue/components/NcEmptyContent';
import NcButton from '@nextcloud/vue/components/NcButton';
import NcLoadingIcon from '@nextcloud/vue/components/NcLoadingIcon';
import InvitationRow from '../molecules/InvitationRow.vue';

const props = defineProps<InvitationListProps>();
const emit = defineEmits<InvitationListEvents>();
const headingId = useId();
const title = computed(
  () =>
    ({
      received: translate('Received invitations'),
      sent: translate('Sent invitations'),
      games: translate('Games'),
      history: translate('History'),
    })[props.kind],
);
const emptyTitle = computed(
  () =>
    ({
      received: translate('No open challenges'),
      sent: translate('No invitations awaiting a reply'),
      games: translate('No games yet'),
      history: translate('No previous invitations'),
    })[props.kind],
);
const emptyDescription = computed(
  () =>
    ({
      received: translate('New challenges will appear here.'),
      sent: translate('Invite someone and choose your time per move.'),
      games: translate('Accepted invitations will appear here.'),
      history: translate(
        'Declined, expired and cancelled invitations will appear here.',
      ),
    })[props.kind],
);
</script>

<template>
  <section class="chess-inbox" :aria-labelledby="headingId">
    <div
      v-if="kind === 'received' || kind === 'sent'"
      class="chess-section-heading"
    >
      <h2 :id="headingId">{{ title }}</h2>
      <NcCounterBubble
        v-if="!loading && invitations.length"
        :count="invitations.length"
      />
    </div>
    <h2 v-else :id="headingId" class="hidden-visually">{{ title }}</h2>
    <div v-if="loading" class="chess-loading" role="status">
      <NcLoadingIcon :size="28" />{{ translate('Loading invitations …') }}
    </div>
    <NcEmptyContent
      v-else-if="!invitations.length"
      class="chess-empty"
      :name="emptyTitle"
      :description="emptyDescription"
    >
      <template #icon><AppIcon name="empty-invitation" /></template>
      <template v-if="kind === 'sent' || kind === 'games'" #action
        ><NcButton @click="emit('compose')">{{
          translate('New game')
        }}</NcButton></template
      >
    </NcEmptyContent>
    <ul v-else class="chess-list">
      <InvitationRow
        v-for="invitation in invitations"
        :key="invitation.id"
        :invitation="invitation"
        :user-id="userId"
        :kind="kind"
        :busy="busyInvitation === invitation.id"
        :disabled="busyInvitation !== null"
        @select="emit('select', $event)"
        @respond="(invitation, action) => emit('respond', invitation, action)"
      />
    </ul>
  </section>
</template>

<style>
.chess-section-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.chess-section-heading h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
}

.chess-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.chess-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  gap: 12px;
  color: var(--color-text-maxcontrast);
}

.chess-empty {
  box-sizing: border-box;
  min-height: 200px;
  padding: 24px 16px;
  border-radius: var(--border-radius-large);
  background: var(--color-background-hover);
}
</style>
