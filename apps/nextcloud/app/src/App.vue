<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue';
import NcButton from '@nextcloud/vue/components/NcButton';
import type { ApiClient } from './api';
import InvitationsPage from './pages/InvitationsPage.vue';

defineProps<{ api: ApiClient }>();
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
  <div v-if="failed" class="cc-shell" role="alert">
    <p>Cloud Chess konnte nicht geladen werden.</p>
    <NcButton @click="reload">Seite neu laden</NcButton>
  </div>
  <InvitationsPage v-else :api="api" />
</template>
