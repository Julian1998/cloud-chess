<script setup lang="ts">
import type { UserSearchProps, UserSearchEvents } from '../../types/components';
import { translate } from '../../platform/i18n';
import { computed, toRef, useId } from 'vue';
import NcSelectUsers, {
  type NcSelectUsersModel,
} from '@nextcloud/vue/components/NcSelectUsers';
import NcNoteCard from '@nextcloud/vue/components/NcNoteCard';
import type { ApiClient } from '../../api';
import type { User } from '../../types/invitations';
import { useUserSearch } from '../../composables/useUserSearch';

const props = defineProps<UserSearchProps>();
const emit = defineEmits<UserSearchEvents>();
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
  <div class="chess-user-search">
    <NcSelectUsers
      :input-id="searchId"
      :input-label="translate('Search players')"
      :model-value="selected"
      :options="options"
      :filterable="false"
      :loading="searching"
      :disabled="disabled"
      :placeholder="translate('Name or username')"
      :aria-describedby="`${searchId}-hint`"
      @search="search"
      @update:model-value="select"
    />
    <p :id="`${searchId}-hint`" class="chess-field-hint" aria-live="polite">
      {{
        selectedUser
          ? translate('{player} selected', {
              player: selectedUser.displayName,
            })
          : searching
            ? translate('Searching …')
            : !selectedUser &&
                query.trim().length >= 2 &&
                !users.length &&
                !error
              ? translate('No players found.')
              : translate('Enter at least two characters.')
      }}
    </p>
    <NcNoteCard v-if="error" type="error" show-alert :text="error" />
  </div>
</template>

<style>
.chess-field-hint {
  color: var(--color-text-maxcontrast);
  font-size: 13px;
  line-height: 1.5;
}

.chess-user-search {
  min-width: 0;
}

.chess-user-search .nc-select-users {
  width: 100%;
}

.chess-field-hint {
  margin: 8px 0 0;
}
</style>
