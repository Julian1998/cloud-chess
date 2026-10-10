<script setup lang="ts">
import type { AppProps } from './types/components';
import { translate } from './platform/i18n';
import { onErrorCaptured, ref } from 'vue';
import NcButton from '@nextcloud/vue/components/NcButton';
import InvitationsPage from './pages/InvitationsPage.vue';
import AppShell from './components/organisms/AppShell.vue';

defineProps<AppProps>();
const failed = ref(false);

onErrorCaptured(() => {
  failed.value = true;
  return false;
});

function reload() {
  window.location.reload();
}
</script>

<template>
  <div v-if="failed" class="chess-shell" role="alert">
    <p>{{ translate('The app could not be loaded.') }}</p>
    <NcButton @click="reload">{{ translate('Reload page') }}</NcButton>
  </div>
  <AppShell v-else :api="api"><InvitationsPage /></AppShell>
</template>
