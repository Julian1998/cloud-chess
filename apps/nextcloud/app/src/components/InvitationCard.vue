<script setup lang="ts">
import { t, getCanonicalLocale } from '@nextcloud/l10n';
import { computed } from 'vue';
import NcButton from '@nextcloud/vue/components/NcButton';
import type { ColorPreference, Invitation, TurnDuration } from '../api';

const props = defineProps<{
  invitation: Invitation;
  received: boolean;
  busy: boolean;
}>();
const emit = defineEmits<{ accept: []; decline: [] }>();
const otherPlayer = computed(() =>
  props.received
    ? props.invitation.challengerName
    : props.invitation.opponentName,
);
const statusLabels: Record<Invitation['status'], string> = {
  pending: t('cloud_chess', 'Pending'),
  accepted: t('cloud_chess', 'Accepted'),
  declined: t('cloud_chess', 'Declined'),
  cancelled: t('cloud_chess', 'Cancelled'),
  expired: t('cloud_chess', 'Expired'),
};
const colorLabels: Record<ColorPreference, string> = {
  white: t('cloud_chess', 'White'),
  black: t('cloud_chess', 'Black'),
  random: t('cloud_chess', 'Randomly assigned'),
};
const durationLabels: Record<TurnDuration, string> = {
  P1D: t('cloud_chess', '1 day per move'),
  P2D: t('cloud_chess', '2 days per move'),
};
const dateTime = new Intl.DateTimeFormat(getCanonicalLocale(), {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateTime.format(date);
}

function playerName(id: string) {
  if (id === props.invitation.challengerId)
    return props.invitation.challengerName;
  if (id === props.invitation.opponentId) return props.invitation.opponentName;
  return id;
}
</script>

<template>
  <article class="cc-invitation">
    <div class="cc-invitation__heading">
      <div>
        <span class="cc-kicker">{{
          received ? t('cloud_chess', 'From') : t('cloud_chess', 'To')
        }}</span>
        <h3>{{ otherPlayer }}</h3>
      </div>
      <span :class="['cc-status', `cc-status--${invitation.status}`]">{{
        statusLabels[invitation.status]
      }}</span>
    </div>
    <dl class="cc-details">
      <div>
        <dt>
          {{
            received
              ? t('cloud_chess', 'Opponent’s preferred color')
              : t('cloud_chess', 'Your preferred color')
          }}
        </dt>
        <dd>{{ colorLabels[invitation.colorPreference] }}</dd>
      </div>
      <div>
        <dt>{{ t('cloud_chess', 'Time per move') }}</dt>
        <dd>{{ durationLabels[invitation.turnDuration] }}</dd>
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
      <span class="cc-game__icon" aria-hidden="true">♞</span>
      <div>
        <strong>{{ t('cloud_chess', 'Game created') }}</strong>
        <p>
          {{
            t('cloud_chess', 'White: {white} · Black: {black}', {
              white: playerName(invitation.game.whitePlayerId),
              black: playerName(invitation.game.blackPlayerId),
            })
          }}
        </p>
        <p>
          {{
            t('cloud_chess', 'First move deadline: {deadline}', {
              deadline: formatDate(invitation.game.turnDeadline),
            })
          }}
        </p>
        <p>
          {{
            t(
              'cloud_chess',
              'The playable chessboard will follow in the next step.',
            )
          }}
        </p>
      </div>
    </section>
    <div v-if="received && invitation.status === 'pending'" class="cc-actions">
      <NcButton variant="primary" :disabled="busy" @click="emit('accept')">{{
        busy ? t('cloud_chess', 'Processing …') : t('cloud_chess', 'Accept')
      }}</NcButton>
      <NcButton :disabled="busy" @click="emit('decline')">{{
        t('cloud_chess', 'Decline')
      }}</NcButton>
    </div>
  </article>
</template>
