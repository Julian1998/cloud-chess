<script setup lang="ts">
import { useId } from 'vue';
import type { Invitation } from '../api';
import InvitationCard from './InvitationCard.vue';

defineProps<{
  invitations: Invitation[];
  received: boolean;
  loading: boolean;
  busyInvitation: string | null;
}>();
const emit = defineEmits<{
  respond: [invitation: Invitation, action: 'accept' | 'decline'];
}>();
const headingId = useId();
</script>

<template>
  <section class="cc-panel cc-inbox" :aria-labelledby="headingId">
    <div class="cc-panel__heading">
      <span class="cc-panel__number" aria-hidden="true">02</span>
      <div>
        <h2 :id="headingId">
          {{ received ? 'Erhaltene Einladungen' : 'Gesendete Einladungen' }}
        </h2>
        <p>Deine offenen und vergangenen Herausforderungen.</p>
      </div>
    </div>
    <div class="cc-list">
      <div v-if="loading" class="cc-empty" aria-live="polite">
        <span class="cc-spinner" aria-hidden="true" />Einladungen werden geladen
        …
      </div>
      <div v-else-if="!invitations.length" class="cc-empty">
        <span aria-hidden="true">♙</span>
        <strong>{{
          received ? 'Noch keine Einladungen' : 'Noch nichts gesendet'
        }}</strong>
        <p>
          {{
            received
              ? 'Neue Herausforderungen erscheinen hier.'
              : 'Nutze das Formular, um eine Partie zu starten.'
          }}
        </p>
      </div>
      <InvitationCard
        v-for="invitation in invitations"
        v-else
        :key="invitation.id"
        :invitation="invitation"
        :received="received"
        :busy="busyInvitation === invitation.id"
        @accept="emit('respond', invitation, 'accept')"
        @decline="emit('respond', invitation, 'decline')"
      />
    </div>
  </section>
</template>
