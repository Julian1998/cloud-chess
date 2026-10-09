<script setup lang="ts">
import { computed, ref } from 'vue';
import NcAppContent from '@nextcloud/vue/components/NcAppContent';
import NcAppNavigation from '@nextcloud/vue/components/NcAppNavigation';
import NcModal from '@nextcloud/vue/components/NcModal';
import NcActionButton from '@nextcloud/vue/components/NcActionButton';
import NcAppNavigationCaption from '@nextcloud/vue/components/NcAppNavigationCaption';
import InvitationCard from '../components/InvitationCard.vue';
import NcAppNavigationItem from '@nextcloud/vue/components/NcAppNavigationItem';
import NcButton from '@nextcloud/vue/components/NcButton';
import type { ApiClient, CreateInvitation, Invitation } from '../api';
import InvitationForm from '../components/InvitationForm.vue';
import InvitationList from '../components/InvitationList.vue';
import { useInvitations } from '../composables/useInvitations';
import { splitInvitations } from '../lib/invitations';

const props = defineProps<{ api: ApiClient }>();
const {
  userId,
  invitations,
  loading,
  refreshing,
  error,
  notice,
  busyInvitation,
  refresh,
  createInvitation,
  respondToInvitation,
} = useInvitations(props.api);
const composing = ref(false);
const selectedId = ref<string | null>(null);
const selected = computed(() =>
  invitations.value.find((invitation) => invitation.id === selectedId.value),
);
const sidebarSections = computed(() => [
  {
    name: 'Handlungsbedarf',
    invitations: invitations.value.filter(
      (invitation) =>
        invitation.status === 'pending' &&
        invitation.opponentId === userId.value,
    ),
  },
  {
    name: 'Einladungen',
    invitations: invitations.value.filter(
      (invitation) =>
        invitation.status === 'pending' &&
        invitation.challengerId === userId.value,
    ),
  },
  {
    name: 'Laufende Partien',
    invitations: invitations.value.filter(
      (invitation) => invitation.game !== null,
    ),
  },
]);
function opponent(invitation: Invitation) {
  return invitation.opponentId === userId.value
    ? invitation.challengerName
    : invitation.opponentName;
}
const groups = computed(() =>
  splitInvitations(invitations.value, userId.value),
);

async function handleCreate(data: CreateInvitation) {
  const created = await createInvitation(data);
  if (created) {
    composing.value = false;
    selectedId.value = null;
  }
  return created;
}
</script>

<template>
  <NcAppNavigation>
    <NcButton class="cc-new-game" variant="primary" @click="composing = true"
      >Neue Partie</NcButton
    >
    <template #list>
      <NcAppNavigationItem
        name="Übersicht"
        :active="!selectedId"
        @click="selectedId = null"
      />
      <template v-for="section in sidebarSections" :key="section.name">
        <NcAppNavigationCaption :name="section.name" />
        <NcAppNavigationItem
          v-for="invitation in section.invitations"
          :key="invitation.id"
          :name="
            invitation.status === 'pending'
              ? `${invitation.opponentId === userId ? 'Von' : 'An'} ${opponent(invitation)}`
              : opponent(invitation)
          "
          :active="selectedId === invitation.id"
          :inline-actions="2"
          :loading="busyInvitation === invitation.id"
          @click="selectedId = invitation.id"
        >
          <template
            #actions
            v-if="
              invitation.status === 'pending' &&
              invitation.opponentId === userId
            "
          >
            <NcActionButton
              :disabled="busyInvitation === invitation.id"
              @click.stop="respondToInvitation(invitation, 'accept')"
            >
              <template #icon
                ><svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="m9 16-4-4-1.4 1.4L9 18.8 21.4 6.4 20 5z"
                  /></svg></template
              >Annehmen
            </NcActionButton>
            <NcActionButton
              :disabled="busyInvitation === invitation.id"
              @click.stop="respondToInvitation(invitation, 'decline')"
            >
              <template #icon
                ><svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="m6.4 5-1.4 1.4L10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6z"
                  /></svg></template
              >Ablehnen
            </NcActionButton>
          </template>
        </NcAppNavigationItem>
      </template>
    </template>
  </NcAppNavigation>
  <NcAppContent>
    <div class="cc-shell">
      <header class="cc-header">
        <div>
          <span class="cc-eyebrow">Cloud Chess</span>
          <h1>Schachpartien, Zug für Zug.</h1>
          <p>Fordere jemanden heraus und spiele in deinem eigenen Tempo.</p>
        </div>
        <NcButton
          :disabled="refreshing || loading"
          aria-label="Einladungen aktualisieren"
          @click="refresh()"
        >
          {{ refreshing ? 'Aktualisiere …' : 'Aktualisieren' }}
        </NcButton>
      </header>
      <div v-if="error" class="cc-message cc-message--error" role="alert">
        <span>{{ error }}</span>
        <NcButton @click="refresh()">Erneut versuchen</NcButton>
      </div>
      <div v-if="notice" class="cc-message cc-message--success" role="status">
        {{ notice }}
      </div>
      <InvitationCard
        v-if="selected"
        :invitation="selected"
        :received="selected.opponentId === userId"
        :busy="busyInvitation === selected.id"
        @accept="respondToInvitation(selected, 'accept')"
        @decline="respondToInvitation(selected, 'decline')"
      />
      <div v-else class="cc-layout">
        <InvitationList
          :invitations="groups.received"
          :received="true"
          :loading="loading"
          :busy-invitation="busyInvitation"
          @respond="respondToInvitation"
        />
        <InvitationList
          :invitations="groups.sent"
          :received="false"
          :loading="loading"
          :busy-invitation="busyInvitation"
          @respond="respondToInvitation"
        />
      </div>
    </div>
  </NcAppContent>
  <NcModal
    v-if="composing"
    name="Neue Partie"
    size="small"
    @close="composing = false"
  >
    <InvitationForm :api="api" :on-create="handleCreate" />
  </NcModal>
</template>
