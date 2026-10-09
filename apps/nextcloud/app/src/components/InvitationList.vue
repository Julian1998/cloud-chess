<script setup lang="ts">
import { t } from '@nextcloud/l10n';
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
          {{
            received
              ? t('cloud_chess', 'Received invitations')
              : t('cloud_chess', 'Sent invitations')
          }}
        </h2>
        <p>{{ t('cloud_chess', 'Your pending and previous challenges.') }}</p>
      </div>
    </div>
    <div class="cc-list">
      <div v-if="loading" class="cc-empty" aria-live="polite">
        <span class="cc-spinner" aria-hidden="true" />{{
          t('cloud_chess', 'Loading invitations …')
        }}
      </div>
      <div v-else-if="!invitations.length" class="cc-empty">
        <span aria-hidden="true">♙</span>
        <strong>{{
          received
            ? t('cloud_chess', 'No invitations yet')
            : t('cloud_chess', 'Nothing sent yet')
        }}</strong>
        <p>
          {{
            received
              ? t('cloud_chess', 'New challenges will appear here.')
              : t('cloud_chess', 'Use New game to start a game.')
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
