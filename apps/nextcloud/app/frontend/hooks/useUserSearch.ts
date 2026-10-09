import { useEffect, useState } from 'react';
import type { ApiClient, User } from '../api';
import { errorMessage } from '../lib/errors';

export function useUserSearch(
  api: ApiClient,
  query: string,
  selectedUser: User | null,
) {
  const [users, setUsers] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const search = query.trim();
    setUsers([]);
    setError(null);
    if (selectedUser || search.length < 2) {
      setSearching(false);
      return;
    }
    let active = true;
    setSearching(true);
    const timer = window.setTimeout(() => {
      void api
        .searchUsers(search)
        .then((result) => {
          if (active) setUsers(result.users);
        })
        .catch((failure: unknown) => {
          if (active) setError(errorMessage(failure));
        })
        .finally(() => {
          if (active) setSearching(false);
        });
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [api, query, selectedUser]);

  return { users, searching, error };
}
