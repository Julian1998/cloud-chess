<script setup lang="ts">
import type {
  PageTemplateProps,
  PageTemplateEvents,
} from '../types/components';
import { translate } from '../platform/i18n';
import NcNoteCard from '@nextcloud/vue/components/NcNoteCard';
import NcButton from '@nextcloud/vue/components/NcButton';
import PageHeader from '../components/molecules/PageHeader.vue';
defineProps<PageTemplateProps>();
const emit = defineEmits<PageTemplateEvents>();
</script>
<template>
  <main class="chess-shell">
    <PageHeader
      :title="title"
      :description="description"
      :refreshing="refreshing"
      :loading="loading"
      @refresh="emit('refresh')"
    />
    <NcNoteCard v-if="error" type="error" show-alert
      ><span>{{ error }}</span
      ><NcButton variant="tertiary" @click="emit('refresh')">{{
        translate('Try again')
      }}</NcButton></NcNoteCard
    >
    <NcNoteCard v-if="notice" type="success" role="status" :text="notice" />

    <slot name="tabs" />
    <slot />
  </main>
</template>

<style>
.chess-sections {
  display: grid;
  gap: 40px;
}

.chess-back {
  margin-bottom: 24px;
}

@media (max-width: 700px) {
  .chess-sections {
    gap: 32px;
  }
}
</style>
