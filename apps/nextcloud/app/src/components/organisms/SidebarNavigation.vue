<script setup lang="ts">
import type {
  SidebarNavigationProps,
  SidebarNavigationEvents,
} from '../../types/components';
import AppIcon from '../atoms/AppIcon.vue';
import { translate } from '../../platform/i18n';
import NcAppNavigation from '@nextcloud/vue/components/NcAppNavigation';
import NcAppNavigationNew from '@nextcloud/vue/components/NcAppNavigationNew';
import NcAppNavigationList from '@nextcloud/vue/components/NcAppNavigationList';
import NcAppNavigationItem from '@nextcloud/vue/components/NcAppNavigationItem';
import NcCounterBubble from '@nextcloud/vue/components/NcCounterBubble';
import NcButton from '@nextcloud/vue/components/NcButton';
import NcLoadingIcon from '@nextcloud/vue/components/NcLoadingIcon';
import InvitationNavigationItem from '../molecules/InvitationNavigationItem.vue';
defineProps<SidebarNavigationProps>();
const inboxOpen = defineModel<boolean>('inboxOpen', { required: true });
const emit = defineEmits<SidebarNavigationEvents>();
</script>
<template>
  <NcAppNavigation class="chess-navigation" aria-label="Chess">
    <template #search>
      <NcAppNavigationNew
        :text="translate('New game')"
        @click="emit('compose')"
      >
        <template #icon><AppIcon name="add" /></template>
      </NcAppNavigationNew>
      <NcAppNavigationList>
        <NcAppNavigationItem
          :name="translate('All games')"
          :active="view === 'games'"
          @click="emit('navigate', 'games')"
        >
          <template #icon><AppIcon name="games" /></template>
        </NcAppNavigationItem>
        <NcAppNavigationItem
          :name="translate('Invitations')"
          :active="view !== 'games' && !selectedId"
          @click="emit('navigate', 'received')"
        >
          <template #icon><AppIcon name="invitation" /></template>
        </NcAppNavigationItem>
      </NcAppNavigationList>
    </template>
    <template #list>
      <li>
        <NcButton
          class="chess-inbox-toggle"
          variant="tertiary"
          alignment="start"
          wide
          :aria-expanded="inboxOpen"
          aria-controls="chess-open-requests"
          @click="inboxOpen = !inboxOpen"
        >
          <template #icon><AppIcon name="open-invitation" /></template>
          <span class="chess-inbox-label">{{
            translate('Open requests')
          }}</span>
          <NcCounterBubble v-if="incoming.length" :count="incoming.length" />
          <AppIcon :name="inboxOpen ? 'chevron-up' : 'chevron-down'" />
        </NcButton>
      </li>
      <li id="chess-open-requests" v-show="inboxOpen">
        <NcAppNavigationList>
          <InvitationNavigationItem
            v-for="invitation in incoming"
            :key="invitation.id"
            :invitation="invitation"
            :active="view === 'received' && selectedId === invitation.id"
            :loading="busyInvitation === invitation.id"
            :disabled="busyInvitation !== null"
            @select="emit('select', $event)"
            @respond="
              (invitation, action) => emit('respond', invitation, action)
            "
          />
          <li v-if="loading" class="chess-inbox-empty">
            <NcLoadingIcon :size="20" />
            {{ translate('Loading invitations …') }}
          </li>
          <li v-if="!loading && !incoming.length" class="chess-inbox-empty">
            {{ translate('No open challenges') }}
          </li>
        </NcAppNavigationList>
      </li>
    </template>
    <template #footer>
      <div class="chess-navigation-settings">
        <NcButton
          wide
          alignment="start"
          aria-haspopup="dialog"
          @click="emit('settings')"
        >
          <template #icon><AppIcon name="settings" /></template>
          {{ translate('Settings') }}
        </NcButton>
      </div>
    </template>
  </NcAppNavigation>
</template>

<style>
.chess-navigation .app-navigation__search {
  flex-shrink: 0;
}

.chess-navigation .app-navigation__list {
  height: auto;
  min-height: 0;
  flex: 1;
  border-top: 1px solid var(--color-border);
}

.chess-navigation .app-navigation__body {
  display: none;
}

.chess-navigation-settings {
  flex-shrink: 0;
  padding: 8px;
}

.chess-inbox-toggle .button-vue__text {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.chess-inbox-label {
  flex: 1;
  text-align: start;
}

#chess-open-requests > .app-navigation-list {
  padding: 0;
}

.chess-inbox-empty {
  padding: 12px;
  color: var(--color-text-maxcontrast);
  font-size: 13px;
}
</style>
