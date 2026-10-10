<script setup lang="ts">
import { t } from '@nextcloud/l10n';
import { computed } from 'vue';
import NcAvatar from '@nextcloud/vue/components/NcAvatar';
import NcButton from '@nextcloud/vue/components/NcButton';
import NcNoteCard from '@nextcloud/vue/components/NcNoteCard';
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
  invitation: Invitation;
  received: boolean;
  busy: boolean;
}>();
const emit = defineEmits<{ accept: []; decline: [] }>();
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
  <article class="cc-invitation">
    <header class="cc-invitation-heading">
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
              ? t('cloud_chess', 'Game created')
              : statusLabels[invitation.status]
          }}
        </p>
      </div>
    </header>
    <dl class="cc-details">
      <div>
        <dt>{{ t('cloud_chess', 'Time per move') }}</dt>
        <dd>{{ durationLabels[invitation.turnDuration] }}</dd>
      </div>
      <div>
        <dt>{{ t('cloud_chess', 'Your color') }}</dt>
        <dd>{{ colorLabels[ownColor] }}</dd>
      </div>
      <div>
        <dt>{{ t('cloud_chess', 'Created') }}</dt>
        <dd>{{ formatDate(invitation.createdAt) }}</dd>
      </div>
      <div v-if="invitation.status === 'pending'">
        <dt>{{ t('cloud_chess', 'Valid until') }}</dt>
        <dd>{{ formatDate(invitation.expiresAt) }}</dd>
      </div>
    </dl>
    <section
      v-if="invitation.game"
      class="cc-game"
      :aria-label="t('cloud_chess', 'Game summary')"
    >
      <h3>{{ t('cloud_chess', 'Game summary') }}</h3>
      <dl class="cc-details">
        <div>
          <dt>{{ t('cloud_chess', 'White') }}</dt>
          <dd>{{ playerName(invitation.game.whitePlayerId) }}</dd>
        </div>
        <div>
          <dt>{{ t('cloud_chess', 'Black') }}</dt>
          <dd>{{ playerName(invitation.game.blackPlayerId) }}</dd>
        </div>
      </dl>
      <p>
        {{
          t('cloud_chess', 'First move deadline: {deadline}', {
            deadline: formatDate(invitation.game.turnDeadline),
          })
        }}
      </p>
      <NcNoteCard
        type="info"
        :text="
          t(
            'cloud_chess',
            'The playable chessboard will follow in the next step.',
          )
        "
      />
    </section>
    <div
      v-if="received && invitation.status === 'pending'"
      class="cc-detail-actions"
    >
      <NcButton variant="primary" :disabled="busy" @click="emit('accept')">
        <template v-if="busy" #icon><NcLoadingIcon /></template>
        {{
          busy ? t('cloud_chess', 'Processing …') : t('cloud_chess', 'Accept')
        }}
      </NcButton>
      <NcButton variant="tertiary" :disabled="busy" @click="emit('decline')">{{
        t('cloud_chess', 'Decline')
      }}</NcButton>
    </div>
  </article>
</template>
