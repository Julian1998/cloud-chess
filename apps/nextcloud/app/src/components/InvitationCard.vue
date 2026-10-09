<script setup lang="ts">
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
  pending: 'Offen',
  accepted: 'Angenommen',
  declined: 'Abgelehnt',
  cancelled: 'Zurückgezogen',
  expired: 'Abgelaufen',
};
const colorLabels: Record<ColorPreference, string> = {
  white: 'Weiß',
  black: 'Schwarz',
  random: 'Zufällig',
};
const durationLabels: Record<TurnDuration, string> = {
  P1D: '1 Tag pro Zug',
  P2D: '2 Tage pro Zug',
};
const dateTime = new Intl.DateTimeFormat('de-DE', {
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
        <span class="cc-kicker">{{ received ? 'Von' : 'An' }}</span>
        <h3>{{ otherPlayer }}</h3>
      </div>
      <span :class="['cc-status', `cc-status--${invitation.status}`]">{{
        statusLabels[invitation.status]
      }}</span>
    </div>
    <dl class="cc-details">
      <div>
        <dt>
          {{ received ? 'Wunschfarbe des Gegners' : 'Deine Wunschfarbe' }}
        </dt>
        <dd>{{ colorLabels[invitation.colorPreference] }}</dd>
      </div>
      <div>
        <dt>Zugzeit</dt>
        <dd>{{ durationLabels[invitation.turnDuration] }}</dd>
      </div>
      <div>
        <dt>Erstellt</dt>
        <dd>{{ formatDate(invitation.createdAt) }}</dd>
      </div>
      <div v-if="invitation.status === 'pending'">
        <dt>Gültig bis</dt>
        <dd>{{ formatDate(invitation.expiresAt) }}</dd>
      </div>
    </dl>
    <section
      v-if="invitation.game"
      class="cc-game"
      aria-label="Partieübersicht"
    >
      <span class="cc-game__icon" aria-hidden="true">♞</span>
      <div>
        <strong>Partie angelegt</strong>
        <p>
          Weiß: {{ playerName(invitation.game.whitePlayerId) }} · Schwarz:
          {{ playerName(invitation.game.blackPlayerId) }}
        </p>
        <p>Erste Zugfrist: {{ formatDate(invitation.game.turnDeadline) }}</p>
        <p>Das spielbare Schachbrett folgt im nächsten Schritt.</p>
      </div>
    </section>
    <div v-if="received && invitation.status === 'pending'" class="cc-actions">
      <NcButton variant="primary" :disabled="busy" @click="emit('accept')">{{
        busy ? 'Wird verarbeitet …' : 'Annehmen'
      }}</NcButton>
      <NcButton :disabled="busy" @click="emit('decline')">Ablehnen</NcButton>
    </div>
  </article>
</template>
