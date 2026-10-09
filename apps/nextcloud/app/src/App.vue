<script setup lang="ts">
import { t } from '@nextcloud/l10n';
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
    <p>{{ t('cloud_chess', 'Cloud Chess could not be loaded.') }}</p>
    <NcButton @click="reload">{{ t('cloud_chess', 'Reload page') }}</NcButton>
  </div>
  <InvitationsPage v-else :api="api" />
</template>
