<script setup lang="ts">
import { t } from '@nextcloud/l10n';
import { computed, useId } from 'vue';
import NcAvatar from '@nextcloud/vue/components/NcAvatar';
import NcListItem from '@nextcloud/vue/components/NcListItem';
import NcCounterBubble from '@nextcloud/vue/components/NcCounterBubble';
import NcEmptyContent from '@nextcloud/vue/components/NcEmptyContent';
import NcButton from '@nextcloud/vue/components/NcButton';
import NcLoadingIcon from '@nextcloud/vue/components/NcLoadingIcon';
import type { Invitation } from '../api';
import {
  colorLabels,
  durationLabels,
  statusLabels,
  playerColor,
  formatDate,
} from '../lib/invitations';

const props = defineProps<{
  invitations: Invitation[];
  userId: string;
  kind: 'received' | 'sent' | 'games' | 'history';
  loading: boolean;
  busyInvitation: string | null;
}>();
const emit = defineEmits<{
  select: [invitation: Invitation];
  respond: [invitation: Invitation, action: 'accept' | 'decline'];
  compose: [];
}>();
const headingId = useId();
const title = computed(
  () =>
    ({
      received: t('cloud_chess', 'Received invitations'),
      sent: t('cloud_chess', 'Sent invitations'),
      games: t('cloud_chess', 'Games'),
      history: t('cloud_chess', 'History'),
    })[props.kind],
);
const emptyTitle = computed(
  () =>
    ({
      received: t('cloud_chess', 'No open challenges'),
      sent: t('cloud_chess', 'No invitations awaiting a reply'),
      games: t('cloud_chess', 'No games yet'),
      history: t('cloud_chess', 'No previous invitations'),
    })[props.kind],
);
const emptyDescription = computed(
  () =>
    ({
      received: t('cloud_chess', 'New challenges will appear here.'),
      sent: t('cloud_chess', 'Invite someone and choose your time per move.'),
      games: t('cloud_chess', 'Accepted invitations will appear here.'),
      history: t(
        'cloud_chess',
        'Declined, expired and cancelled invitations will appear here.',
      ),
    })[props.kind],
);
function opponent(invitation: Invitation) {
  return invitation.opponentId === props.userId
    ? { id: invitation.challengerId, name: invitation.challengerName }
    : { id: invitation.opponentId, name: invitation.opponentName };
}
</script>

<template>
  <section class="cc-inbox" :aria-labelledby="headingId">
    <div
      v-if="kind === 'received' || kind === 'sent'"
      class="cc-section-heading"
    >
      <h2 :id="headingId">{{ title }}</h2>
      <NcCounterBubble
        v-if="!loading && invitations.length"
        :count="invitations.length"
      />
    </div>
    <h2 v-else :id="headingId" class="hidden-visually">{{ title }}</h2>
    <div v-if="loading" class="cc-loading" role="status">
      <NcLoadingIcon :size="28" />{{
        t('cloud_chess', 'Loading invitations …')
      }}
    </div>
    <NcEmptyContent
      v-else-if="!invitations.length"
      class="cc-empty"
      :name="emptyTitle"
      :description="emptyDescription"
    >
      <template #icon
        ><svg class="cc-empty-icon" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M8 12h32v24H8zM8 14l16 12 16-12" /></svg
      ></template>
      <template v-if="kind === 'sent' || kind === 'games'" #action
        ><NcButton @click="emit('compose')">{{
          t('cloud_chess', 'New game')
        }}</NcButton></template
      >
    </NcEmptyContent>
    <ul v-else class="cc-list">
      <NcListItem
        v-for="invitation in invitations"
        :key="invitation.id"
        class="cc-invitation-row"
        :name="opponent(invitation).name"
        :link-aria-label="
          t('cloud_chess', 'View details for {player}', {
            player: opponent(invitation).name,
          })
        "
        @click="emit('select', invitation)"
      >
        <template #icon
          ><NcAvatar
            :user="opponent(invitation).id"
            :display-name="opponent(invitation).name"
            :size="44"
            :disable-menu="true"
            :disable-tooltip="true"
        /></template>
        <template #subname
          ><span class="cc-row-summary"
            >{{ durationLabels[invitation.turnDuration]
            }}<span class="cc-row-color">{{
              t('cloud_chess', 'Your color: {color}', {
                color: colorLabels[playerColor(invitation, userId)],
              })
            }}</span></span
          ></template
        >
        <template #extra>
          <div class="cc-row-meta">
            <template v-if="invitation.status === 'pending'">{{
              t('cloud_chess', 'Valid until {date}', {
                date: formatDate(invitation.expiresAt),
              })
            }}</template>
            <template v-else>{{ formatDate(invitation.createdAt) }}</template>
          </div>
        </template>
        <template #extra-actions>
          <div v-if="kind === 'received'" class="cc-row-actions">
            <NcButton
              variant="primary"
              :disabled="busyInvitation !== null"
              @click.stop="emit('respond', invitation, 'accept')"
            >
              <template v-if="busyInvitation === invitation.id" #icon
                ><NcLoadingIcon
              /></template>
              {{
                busyInvitation === invitation.id
                  ? t('cloud_chess', 'Processing …')
                  : t('cloud_chess', 'Accept')
              }}
            </NcButton>
            <NcButton
              variant="tertiary"
              :disabled="busyInvitation !== null"
              @click.stop="emit('respond', invitation, 'decline')"
              >{{ t('cloud_chess', 'Decline') }}</NcButton
            >
          </div>
          <span v-else class="cc-row-status">{{
            kind === 'games'
              ? t('cloud_chess', 'Game created')
              : statusLabels[invitation.status]
          }}</span>
        </template>
      </NcListItem>
    </ul>
  </section>
</template>
