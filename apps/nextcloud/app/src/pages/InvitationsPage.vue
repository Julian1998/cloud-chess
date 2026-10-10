<script setup lang="ts">
import { t } from '@nextcloud/l10n';
import { emit } from '@nextcloud/event-bus';
import { useIsMobile } from '@nextcloud/vue/composables/useIsMobile';
import { computed, ref, watch } from 'vue';
import NcAppContent from '@nextcloud/vue/components/NcAppContent';
import NcAppNavigation from '@nextcloud/vue/components/NcAppNavigation';
import NcAppNavigationNew from '@nextcloud/vue/components/NcAppNavigationNew';
import NcAppNavigationList from '@nextcloud/vue/components/NcAppNavigationList';
import NcAppSettingsDialog from '@nextcloud/vue/components/NcAppSettingsDialog';
import NcAppSettingsSection from '@nextcloud/vue/components/NcAppSettingsSection';
import NcCheckboxRadioSwitch from '@nextcloud/vue/components/NcCheckboxRadioSwitch';
import NcAvatar from '@nextcloud/vue/components/NcAvatar';
import NcAppNavigationItem from '@nextcloud/vue/components/NcAppNavigationItem';
import NcCounterBubble from '@nextcloud/vue/components/NcCounterBubble';
import NcButton from '@nextcloud/vue/components/NcButton';
import NcNoteCard from '@nextcloud/vue/components/NcNoteCard';
import NcLoadingIcon from '@nextcloud/vue/components/NcLoadingIcon';
import type { ApiClient, CreateInvitation, Invitation } from '../api';
import InvitationCard from '../components/InvitationCard.vue';
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
const settingsOpen = ref(false);
const isMobile = useIsMobile();
const view = ref<'received' | 'sent' | 'games' | 'history'>('received');
const selectedId = ref<string | null | undefined>(undefined);
const inboxOpen = ref(true);
watch(userId, (id) => {
  if (!id) return;
  try {
    inboxOpen.value =
      localStorage.getItem(`cloud-chess:${id}:inbox-open`) !== 'false';
  } catch {
    /* Storage can be unavailable in private sessions. */
  }
});
watch(inboxOpen, (open) => {
  if (!userId.value) return;
  try {
    localStorage.setItem(
      `cloud-chess:${userId.value}:inbox-open`,
      String(open),
    );
  } catch {
    /* The navigation still works without persistence. */
  }
});
const groups = computed(() =>
  splitInvitations(invitations.value, userId.value),
);
const incoming = computed(() =>
  [...groups.value.received].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  ),
);
const selected = computed(() =>
  view.value === 'received' && selectedId.value !== null
    ? (incoming.value.find(({ id }) => id === selectedId.value) ??
      incoming.value[0])
    : invitations.value.find(({ id }) => id === selectedId.value),
);
const title = computed(
  () =>
    ({
      received: t('cloud_chess', 'Invitations'),
      sent: t('cloud_chess', 'Invitations'),
      games: t('cloud_chess', 'All games'),
      history: t('cloud_chess', 'Invitations'),
    })[view.value],
);
const description = computed(
  () =>
    ({
      received: t(
        'cloud_chess',
        'Reply to a challenge or invite someone to play.',
      ),
      sent: t('cloud_chess', 'Invite someone and choose your time per move.'),
      games: t('cloud_chess', 'Your accepted challenges and game details.'),
      history: t('cloud_chess', 'Previous invitations, all in one place.'),
    })[view.value],
);
function navigate(next: typeof view.value) {
  view.value = next;
  selectedId.value = null;
  closeMobileNavigation();
}
function closeMobileNavigation() {
  if (isMobile.value) emit('toggle-navigation', { open: false });
}
function selectIncoming(invitation: Invitation) {
  view.value = 'received';
  selectedId.value = invitation.id;
  closeMobileNavigation();
}
function compose() {
  error.value = null;
  composing.value = true;
}
async function handleCreate(data: CreateInvitation) {
  const created = await createInvitation(data);
  if (created) {
    composing.value = false;
    navigate('sent');
  }
  return created;
}
async function respond(invitation: Invitation, action: 'accept' | 'decline') {
  await respondToInvitation(invitation, action);
  if (!error.value) {
    selectedId.value = incoming.value[0]?.id ?? null;
    if (action === 'accept') {
      view.value = 'games';
      selectedId.value =
        invitations.value.find((item) => item.id === invitation.id && item.game)
          ?.id ?? null;
    }
  }
}
</script>

<template>
  <NcAppNavigation class="cc-navigation" aria-label="Cloud Chess">
    <template #search>
      <NcAppNavigationNew :text="t('cloud_chess', 'New game')" @click="compose">
        <template #icon
          ><svg class="cc-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" /></svg
        ></template>
      </NcAppNavigationNew>
      <NcAppNavigationList>
        <NcAppNavigationItem
          :name="t('cloud_chess', 'All games')"
          :active="view === 'games'"
          @click="navigate('games')"
        >
          <template #icon
            ><svg class="cc-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 4h16v16H4zM4 12h16M12 4v16" />
              <path
                d="M4 4h8v8H4zM12 12h8v8h-8z"
                fill="currentColor"
                stroke="none"
              /></svg
          ></template>
        </NcAppNavigationItem>
        <NcAppNavigationItem
          :name="t('cloud_chess', 'Invitations')"
          :active="view !== 'games' && !selected"
          @click="navigate('received')"
        >
          <template #icon
            ><svg class="cc-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 5h16v14H4zM4 6l8 6 8-6" /></svg
          ></template>
        </NcAppNavigationItem>
      </NcAppNavigationList>
    </template>
    <template #list>
      <li>
        <NcButton
          class="cc-inbox-toggle"
          variant="tertiary"
          alignment="start"
          wide
          :aria-expanded="inboxOpen"
          aria-controls="cc-open-requests"
          @click="inboxOpen = !inboxOpen"
        >
          <template #icon
            ><svg class="cc-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4 9v11h16V9L12 3 4 9Zm0 0 8 6 8-6M4 20l6-6M20 20l-6-6"
              /></svg
          ></template>
          <span class="cc-inbox-label">{{
            t('cloud_chess', 'Open requests')
          }}</span>
          <NcCounterBubble v-if="incoming.length" :count="incoming.length" />
          <svg class="cc-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path :d="inboxOpen ? 'm7 14 5-5 5 5' : 'm7 10 5 5 5-5'" />
          </svg>
        </NcButton>
      </li>
      <li id="cc-open-requests" v-show="inboxOpen">
        <NcAppNavigationList>
          <NcAppNavigationItem
            v-for="invitation in incoming"
            :key="invitation.id"
            :name="invitation.challengerName"
            :loading="busyInvitation === invitation.id"
            :active="view === 'received' && selected?.id === invitation.id"
            @click="selectIncoming(invitation)"
          >
            <template #icon
              ><NcAvatar
                :user="invitation.challengerId"
                :display-name="invitation.challengerName"
                :size="32"
                :disable-menu="true"
                :disable-tooltip="true"
            /></template>
            <template #extra>
              <div class="cc-invite-quick-actions">
                <NcButton
                  variant="tertiary"
                  class="cc-invite-accept"
                  :aria-label="`${t('cloud_chess', 'Accept')}: ${invitation.challengerName}`"
                  :title="t('cloud_chess', 'Accept')"
                  :disabled="!!busyInvitation"
                  @click.stop="
                    respond(invitation, 'accept');
                    closeMobileNavigation();
                  "
                >
                  <template #icon
                    ><svg
                      class="cc-icon"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="m5 12 4 4L19 6" /></svg
                  ></template>
                </NcButton>
                <NcButton
                  variant="tertiary"
                  class="cc-invite-decline"
                  :aria-label="`${t('cloud_chess', 'Decline')}: ${invitation.challengerName}`"
                  :title="t('cloud_chess', 'Decline')"
                  :disabled="!!busyInvitation"
                  @click.stop="
                    respond(invitation, 'decline');
                    closeMobileNavigation();
                  "
                >
                  <template #icon
                    ><svg
                      class="cc-icon"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="m6 6 12 12M18 6 6 18" /></svg
                  ></template>
                </NcButton>
              </div>
            </template>
          </NcAppNavigationItem>
          <li v-if="loading" class="cc-inbox-empty">
            <NcLoadingIcon :size="20" />
            {{ t('cloud_chess', 'Loading invitations …') }}
          </li>
          <li v-if="!loading && !incoming.length" class="cc-inbox-empty">
            {{ t('cloud_chess', 'No open challenges') }}
          </li>
        </NcAppNavigationList>
      </li>
    </template>
    <template #footer>
      <div class="cc-navigation-settings">
        <NcButton
          wide
          alignment="start"
          aria-haspopup="dialog"
          @click="
            settingsOpen = true;
            closeMobileNavigation();
          "
        >
          <template #icon
            ><svg class="cc-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path
                d="m10 2-.6 2.5-2 .9-2.4-.7-2 3.5 1.8 1.8v2L3 13.8l2 3.5 2.4-.7 2 .9.6 2.5h4l.6-2.5 2-.9 2.4.7 2-3.5-1.8-1.8v-2L21 8.2l-2-3.5-2.4.7-2-.9L14 2Z"
              /></svg
          ></template>
          {{ t('cloud_chess', 'Settings') }}
        </NcButton>
      </div>
    </template>
  </NcAppNavigation>
  <NcAppContent>
    <main class="cc-shell">
      <header class="cc-header">
        <div>
          <h1>{{ title }}</h1>
          <p>{{ description }}</p>
        </div>
        <NcButton
          variant="tertiary"
          :disabled="refreshing || loading"
          :aria-label="t('cloud_chess', 'Refresh invitations')"
          @click="refresh()"
        >
          <template #icon
            ><NcLoadingIcon v-if="refreshing" /><svg
              v-else
              class="cc-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M20 7v5h-5M4 17v-5h5M5 8a8 8 0 0 1 13-3l2 3M4 16l2 3a8 8 0 0 0 13-3"
              /></svg
          ></template>
          {{ t('cloud_chess', 'Refresh') }}
        </NcButton>
      </header>
      <NcNoteCard v-if="error && !composing" type="error" show-alert
        ><span>{{ error }}</span
        ><NcButton variant="tertiary" @click="refresh()">{{
          t('cloud_chess', 'Try again')
        }}</NcButton></NcNoteCard
      >
      <NcNoteCard
        v-if="notice && !composing"
        type="success"
        role="status"
        :text="notice"
      />
      <nav
        v-if="view !== 'games'"
        class="cc-invitation-tabs"
        :aria-label="t('cloud_chess', 'Invitations')"
      >
        <NcButton
          v-for="tab in [
            { id: 'received' as const, label: t('cloud_chess', 'Received') },
            { id: 'sent' as const, label: t('cloud_chess', 'Sent') },
            { id: 'history' as const, label: t('cloud_chess', 'History') },
          ]"
          :key="tab.id"
          :variant="view === tab.id ? 'secondary' : 'tertiary'"
          :aria-pressed="view === tab.id"
          @click="navigate(tab.id)"
          >{{ tab.label }}</NcButton
        >
      </nav>
      <template v-if="selected">
        <NcButton class="cc-back" variant="tertiary" @click="selectedId = null">
          <template #icon
            ><svg class="cc-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="m12 5-7 7 7 7M5 12h15" /></svg
          ></template>
          {{ t('cloud_chess', 'Back to {view}', { view: title }) }}
        </NcButton>
        <InvitationCard
          :invitation="selected"
          :received="selected.opponentId === userId"
          :busy="busyInvitation !== null"
          @accept="respond(selected, 'accept')"
          @decline="respond(selected, 'decline')"
        />
      </template>
      <div v-else class="cc-sections">
        <InvitationList
          :invitations="
            view === 'games'
              ? groups.games
              : view === 'received'
                ? incoming
                : view === 'sent'
                  ? groups.sent
                  : groups.history
          "
          :user-id="userId"
          :kind="view"
          :loading="loading"
          :busy-invitation="busyInvitation"
          @select="selectedId = $event.id"
          @compose="compose"
          @respond="respond"
        />
      </div>
    </main>
  </NcAppContent>
  <NcAppSettingsDialog
    v-model:open="settingsOpen"
    :name="t('cloud_chess', 'Settings')"
    no-version
  >
    <NcAppSettingsSection
      id="navigation"
      :name="t('cloud_chess', 'Invitations')"
    >
      <NcCheckboxRadioSwitch v-model="inboxOpen">{{
        t('cloud_chess', 'Expand open requests')
      }}</NcCheckboxRadioSwitch>
    </NcAppSettingsSection>
  </NcAppSettingsDialog>
  <InvitationForm
    v-if="composing"
    :api="api"
    :on-create="handleCreate"
    :error="error"
    @close="composing = false"
  />
</template>
