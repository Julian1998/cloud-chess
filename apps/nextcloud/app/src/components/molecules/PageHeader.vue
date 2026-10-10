<script setup lang="ts">
import type { PageHeaderProps, PageHeaderEvents } from '../../types/components';
import AppIcon from '../atoms/AppIcon.vue';
import { translate } from '../../platform/i18n';
import NcButton from '@nextcloud/vue/components/NcButton';
import NcLoadingIcon from '@nextcloud/vue/components/NcLoadingIcon';
defineProps<PageHeaderProps>();
const emit = defineEmits<PageHeaderEvents>();
</script>
<template>
  <header class="chess-header">
    <div>
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
    </div>
    <NcButton
      variant="tertiary"
      :disabled="refreshing || loading"
      :aria-label="translate('Refresh')"
      @click="emit('refresh')"
    >
      <template #icon
        ><NcLoadingIcon v-if="refreshing" /><AppIcon v-else name="refresh"
      /></template>
      {{ translate('Refresh') }}
    </NcButton>
  </header>
</template>

<style>
.chess-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 40px;
}

.chess-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.chess-header p {
  margin: 8px 0 0;
  color: var(--color-text-maxcontrast);
}

@media (max-width: 700px) {
  .chess-header {
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 28px;
  }

  .chess-header h1 {
    font-size: 24px;
  }

  .chess-header > button {
    flex-shrink: 0;
  }

  .chess-header > button .button-vue__text {
    display: none;
  }
}
</style>
