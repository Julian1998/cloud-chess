import { ref, watch, type Ref } from 'vue';
import type { ApiClient, User } from '../api';
import { errorMessage } from '../lib/errors';

export function useUserSearch(
  api: ApiClient,
  query: Ref<string>,
  selectedUser: Ref<User | null>,
) {
  const users = ref<User[]>([]);
  const searching = ref(false);
  const error = ref<string | null>(null);

  watch(
    [query, selectedUser],
    ([value, selected], _previous, onCleanup) => {
      const search = value.trim();
      users.value = [];
      error.value = null;
      if (selected || search.length < 2) {
        searching.value = false;
        return;
      }
      let active = true;
      searching.value = true;
      const timer = window.setTimeout(() => {
        void api
          .searchUsers(search)
          .then((result) => {
            if (active) users.value = result.users;
          })
          .catch((failure: unknown) => {
            if (active) error.value = errorMessage(failure);
          })
          .finally(() => {
            if (active) searching.value = false;
          });
      }, 300);

      onCleanup(() => {
        active = false;
        window.clearTimeout(timer);
      });
    },
    { immediate: true },
  );

  return { users, searching, error };
}
