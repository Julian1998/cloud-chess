<script setup lang="ts">
import type {
  InvitationCardProps,
  InvitationCardEvents,
} from '../../types/components';
import { translate } from '../../platform/i18n';
import { computed } from 'vue';
import { useDateTime } from '../../composables/useDateTime';
import NcAvatar from '@nextcloud/vue/components/NcAvatar';
import NcNoteCard from '@nextcloud/vue/components/NcNoteCard';
import InvitationResponseActions from '../molecules/InvitationResponseActions.vue';
import {
  colorLabels,
  durationLabels,
  statusLabels,
  playerColor,
} from '../../lib/invitations';

const props = defineProps<InvitationCardProps>();
const createdAt = useDateTime(() => props.invitation.createdAt);
const expiresAt = useDateTime(() => props.invitation.expiresAt);
const turnDeadline = useDateTime(
  () => props.invitation.game?.turnDeadline ?? '',
);
const emit = defineEmits<InvitationCardEvents>();
const otherPlayer = computed(() =>
  props.received
    ? {
        id: props.invitation.challengerId,
        name: props.invitation.challengerName,
      }
    : { id: props.invitation.opponentId, name: props.invitation.opponentName },
);
const ownColor = computed(() =>
  playerColor(
    props.invitation,
    props.received
      ? props.invitation.opponentId
      : props.invitation.challengerId,
  ),
);
function playerName(id: string) {
  return id === props.invitation.challengerId
    ? props.invitation.challengerName
    : props.invitation.opponentName;
}
</script>

<template>
  <article class="chess-invitation">
    <header class="chess-invitation-heading">
      <NcAvatar
        :user="otherPlayer.id"
        :display-name="otherPlayer.name"
        :size="56"
        :disable-menu="true"
        :disable-tooltip="true"
      />
      <div>
        <h2>{{ otherPlayer.name }}</h2>
        <p>
          {{
            invitation.game
              ? translate('Game created')
              : statusLabels[invitation.status]
          }}
        </p>
      </div>
    </header>
    <dl class="chess-details">
      <div>
        <dt>{{ translate('Time per move') }}</dt>
        <dd>{{ durationLabels[invitation.turnDuration] }}</dd>
      </div>
      <div>
        <dt>{{ translate('Your color') }}</dt>
        <dd>{{ colorLabels[ownColor] }}</dd>
      </div>
      <div>
        <dt>{{ translate('Created') }}</dt>
        <dd>{{ createdAt }}</dd>
      </div>
      <div v-if="invitation.status === 'pending'">
        <dt>{{ translate('Valid until') }}</dt>
        <dd>{{ expiresAt }}</dd>
      </div>
    </dl>
    <section
      v-if="invitation.game"
      class="chess-game"
      :aria-label="translate('Game summary')"
    >
      <h3>{{ translate('Game summary') }}</h3>
      <dl class="chess-details">
        <div>
          <dt>{{ translate('White') }}</dt>
          <dd>{{ playerName(invitation.game.whitePlayerId) }}</dd>
        </div>
        <div>
          <dt>{{ translate('Black') }}</dt>
          <dd>{{ playerName(invitation.game.blackPlayerId) }}</dd>
        </div>
      </dl>
      <p>
        {{
          translate('First move deadline: {deadline}', {
            deadline: turnDeadline,
          })
        }}
      </p>
      <NcNoteCard
        type="info"
        :text="
          translate('The playable chessboard will follow in the next step.')
        "
      />
    </section>
    <InvitationResponseActions
      v-if="received && invitation.status === 'pending'"
      class="chess-detail-actions"
      :busy="busy"
      :disabled="busy"
      @accept="emit('accept')"
      @decline="emit('decline')"
    />
  </article>
</template>

<style>
.chess-invitation-heading p,
.chess-game > p {
  margin: 8px 0 0;
  color: var(--color-text-maxcontrast);
}

.chess-game h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
}

.chess-invitation {
  max-width: 720px;
}

.chess-invitation-heading {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.chess-invitation-heading h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.chess-details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px 32px;
  margin: 0;
}

.chess-details > div {
  min-width: 0;
}

.chess-details dt {
  display: block;
  width: auto;
  padding: 0;
  text-align: start;
  margin: 0 0 4px;
  color: var(--color-text-maxcontrast);
  font-size: 13px;
  font-weight: normal;
}

.chess-details dd {
  display: block;
  width: auto;
  padding: 0;
  margin: 0;
  font-weight: 500;
  overflow-wrap: anywhere;
}

.chess-game,
.chess-detail-actions {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--color-border);
}

.chess-game .chess-details {
  margin-top: 20px;
}

@media (max-width: 380px) {
  .chess-details {
    grid-template-columns: 1fr;
  }
}
</style>
