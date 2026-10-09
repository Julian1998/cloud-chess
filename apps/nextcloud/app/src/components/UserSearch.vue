<script setup lang="ts">
import { toRef, useId } from 'vue';
import type { ApiClient, User } from '../api';
import { useUserSearch } from '../composables/useUserSearch';

const props = defineProps<{
  api: ApiClient;
  query: string;
  selectedUser: User | null;
}>();
const emit = defineEmits<{
  'update:query': [value: string];
  select: [user: User];
}>();
const searchId = useId();
const { users, searching, error } = useUserSearch(
  props.api,
  toRef(props, 'query'),
  toRef(props, 'selectedUser'),
);

function change(event: Event) {
  emit('update:query', (event.target as HTMLInputElement).value);
}
</script>

<template>
  <div class="cc-field cc-user-search">
    <label :for="searchId">Mitspieler suchen</label>
    <div class="cc-search-input">
      <span aria-hidden="true">⌕</span>
      <input
        :id="searchId"
        type="search"
        :value="query"
        autocomplete="off"
        placeholder="Name oder Benutzerkennung"
        :aria-describedby="`${searchId}-hint`"
        :aria-controls="`${searchId}-results`"
        :aria-expanded="users.length > 0"
        @input="change"
      />
    </div>
    <small :id="`${searchId}-hint`">Gib mindestens zwei Zeichen ein.</small>
    <p v-if="searching" class="cc-search-state">Suche läuft …</p>
    <p v-if="error" class="cc-search-state cc-search-state--error" role="alert">
      {{ error }}
    </p>
    <p
      v-if="
        !searching &&
        query.trim().length >= 2 &&
        !users.length &&
        !selectedUser &&
        !error
      "
      class="cc-search-state"
    >
      Keine Personen gefunden.
    </p>
    <ul v-if="users.length" :id="`${searchId}-results`" class="cc-user-results">
      <li v-for="user in users" :key="user.id">
        <button type="button" @click="emit('select', user)">
          <span class="cc-avatar" aria-hidden="true">{{
            user.displayName.trim().slice(0, 1).toLocaleUpperCase('de')
          }}</span>
          <span
            ><strong>{{ user.displayName }}</strong
            ><small>{{ user.id }}</small></span
          >
        </button>
      </li>
    </ul>
    <p v-if="selectedUser" class="cc-selected" role="status">
      ✓ {{ selectedUser.displayName }} ausgewählt
    </p>
  </div>
</template>
