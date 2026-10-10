<script setup lang="ts">
import type {
  InvitationRowProps,
  InvitationRowEvents,
} from '../../types/components';
import { translate } from '../../platform/i18n';
import { computed } from 'vue';
import { useDateTime } from '../../composables/useDateTime';
import NcAvatar from '@nextcloud/vue/components/NcAvatar';
import NcListItem from '@nextcloud/vue/components/NcListItem';
import InvitationResponseActions from './InvitationResponseActions.vue';
import {
  colorLabels,
  durationLabels,
  statusLabels,
  playerColor,
} from '../../lib/invitations';
const props = defineProps<InvitationRowProps>();
const createdAt = useDateTime(() => props.invitation.createdAt);
const expiresAt = useDateTime(() => props.invitation.expiresAt);
const emit = defineEmits<InvitationRowEvents>();
const opponent = computed(() =>
  props.invitation.opponentId === props.userId
    ? {
        id: props.invitation.challengerId,
        name: props.invitation.challengerName,
      }
    : { id: props.invitation.opponentId, name: props.invitation.opponentName },
);
</script>
<template>
  <NcListItem
    class="chess-invitation-row"
    :name="opponent.name"
    :link-aria-label="
      translate('View details for {player}', {
        player: opponent.name,
      })
    "
    @click="emit('select', invitation)"
  >
    <template #icon
      ><NcAvatar
        :user="opponent.id"
        :display-name="opponent.name"
        :size="44"
        :disable-menu="true"
        :disable-tooltip="true"
    /></template>
    <template #subname
      ><span class="chess-row-summary"
        >{{ durationLabels[invitation.turnDuration]
        }}<span class="chess-row-color">{{
          translate('Your color: {color}', {
            color: colorLabels[playerColor(invitation, userId)],
          })
        }}</span></span
      ></template
    >
    <template #extra>
      <div class="chess-row-meta">
        <template v-if="invitation.status === 'pending'">{{
          translate('Valid until {date}', {
            date: expiresAt,
          })
        }}</template>
        <template v-else>{{ createdAt }}</template>
      </div>
    </template>
    <template #extra-actions>
      <InvitationResponseActions
        v-if="kind === 'received'"
        class="chess-row-actions"
        :busy="busy"
        :disabled="disabled"
        @accept="emit('respond', invitation, 'accept')"
        @decline="emit('respond', invitation, 'decline')"
      />
      <span v-else class="chess-row-status">{{
        kind === 'games'
          ? translate('Game created')
          : statusLabels[invitation.status]
      }}</span>
    </template>
  </NcListItem>
</template>

<style>
.chess-invitation-row + .chess-invitation-row {
  border-top: 1px solid var(--color-border);
}

.chess-invitation-row .list-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  padding: 16px 12px;
  border-radius: var(--border-radius-large);
}

.chess-invitation-row .list-item__anchor {
  height: auto;
}

.chess-invitation-row .list-item__extra {
  grid-column: 1;
  margin-top: 4px;
  padding-inline-start: 52px;
}

.chess-invitation-row .list-item-content__extra-actions {
  grid-column: 2;
  grid-row: 1 / span 2;
  margin-inline-start: 24px;
}

.chess-invitation-row .list-item-content__subname {
  white-space: normal;
}

.chess-row-summary {
  display: flex;
  flex-wrap: wrap;
  column-gap: 16px;
  row-gap: 2px;
  line-height: 1.5;
}

.chess-row-meta,
.chess-row-status {
  color: var(--color-text-maxcontrast);
  font-size: 13px;
  line-height: 1.5;
}

.chess-row-meta {
  font-variant-numeric: tabular-nums;
}

.chess-row-status {
  padding-inline: 8px;
}

@media (max-width: 700px) {
  .chess-invitation-row .list-item {
    grid-template-columns: minmax(0, 1fr);
    padding: 16px 8px;
  }

  .chess-invitation-row .list-item-content__extra-actions {
    grid-column: 1;
    grid-row: 3;
    justify-content: flex-start;
    margin: 12px 0 0;
    padding-inline-start: 52px;
  }

  .chess-row-status {
    padding: 0;
  }
}

@media (max-width: 380px) {
  .chess-invitation-row .list-item-content__extra-actions {
    padding-inline-start: 0;
  }
}
</style>
