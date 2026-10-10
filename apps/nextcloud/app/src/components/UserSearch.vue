<script setup lang="ts">
import { t } from '@nextcloud/l10n';
import { computed, toRef, useId } from 'vue';
import NcSelectUsers, {
  type NcSelectUsersModel,
} from '@nextcloud/vue/components/NcSelectUsers';
import NcNoteCard from '@nextcloud/vue/components/NcNoteCard';
import type { ApiClient, User } from '../api';
import { useUserSearch } from '../composables/useUserSearch';

const props = defineProps<{
  api: ApiClient;
  query: string;
  selectedUser: User | null;
  disabled: boolean;
}>();
const emit = defineEmits<{
  'update:query': [value: string];
  select: [user: User | null];
}>();
const searchId = useId();
const { users, searching, error } = useUserSearch(
  props.api,
  toRef(props, 'query'),
  toRef(props, 'selectedUser'),
);
const options = computed(() =>
  users.value.map((user) => ({ ...user, user: user.id, subname: user.id })),
);
const selected = computed(() =>
  props.selectedUser
    ? {
        ...props.selectedUser,
        user: props.selectedUser.id,
        subname: props.selectedUser.id,
      }
    : undefined,
);
function select(value: NcSelectUsersModel | NcSelectUsersModel[] | undefined) {
  emit(
    'select',
    value && !Array.isArray(value)
      ? { id: value.id, displayName: value.displayName }
      : null,
  );
}
function search(value: string) {
  // NcSelect clears its search on selection; retain the discovery term for server validation.
  if (value.trim() || !props.selectedUser) emit('update:query', value);
}
</script>

<template>
  <div class="cc-user-search">
    <NcSelectUsers
      :input-id="searchId"
      :input-label="t('cloud_chess', 'Search players')"
      :model-value="selected"
      :options="options"
      :filterable="false"
      :loading="searching"
      :disabled="disabled"
      :placeholder="t('cloud_chess', 'Name or username')"
      :aria-describedby="`${searchId}-hint`"
      @search="search"
      @update:model-value="select"
    />
    <p :id="`${searchId}-hint`" class="cc-field-hint" aria-live="polite">
      {{
        selectedUser
          ? t('cloud_chess', '{player} selected', {
              player: selectedUser.displayName,
            })
          : searching
            ? t('cloud_chess', 'Searching …')
            : !selectedUser &&
                query.trim().length >= 2 &&
                !users.length &&
                !error
              ? t('cloud_chess', 'No players found.')
              : t('cloud_chess', 'Enter at least two characters.')
      }}
    </p>
    <NcNoteCard v-if="error" type="error" show-alert :text="error" />
  </div>
</template>
