import { useId } from 'react';
import type { ApiClient, User } from '../api';
import { useUserSearch } from '../hooks/useUserSearch';

type UserSearchProps = {
  api: ApiClient;
  query: string;
  selectedUser: User | null;
  onChange: (query: string) => void;
  onSelect: (user: User) => void;
};

export default function UserSearch({
  api,
  query,
  selectedUser,
  onChange,
  onSelect,
}: UserSearchProps) {
  const searchId = useId();
  const {
    users,
    searching,
    error: searchError,
  } = useUserSearch(api, query, selectedUser);
  return (
    <div className="cc-field cc-user-search">
      <label htmlFor={searchId}>Mitspieler suchen</label>
      <div className="cc-search-input">
        <span aria-hidden="true">⌕</span>
        <input
          id={searchId}
          type="search"
          value={query}
          autoComplete="off"
          placeholder="Name oder Benutzerkennung"
          aria-describedby={`${searchId}-hint`}
          aria-controls={`${searchId}-results`}
          aria-expanded={users.length > 0}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      <small id={`${searchId}-hint`}>Gib mindestens zwei Zeichen ein.</small>
      {searching && <p className="cc-search-state">Suche läuft …</p>}
      {searchError && (
        <p className="cc-search-state cc-search-state--error" role="alert">
          {searchError}
        </p>
      )}
      {!searching &&
        query.trim().length >= 2 &&
        users.length === 0 &&
        !selectedUser &&
        !searchError && (
          <p className="cc-search-state">Keine Personen gefunden.</p>
        )}
      {users.length > 0 && (
        <ul className="cc-user-results" id={`${searchId}-results`}>
          {users.map((user) => (
            <li key={user.id}>
              <button type="button" onClick={() => onSelect(user)}>
                <span className="cc-avatar" aria-hidden="true">
                  {user.displayName.trim().slice(0, 1).toLocaleUpperCase('de')}
                </span>
                <span>
                  <strong>{user.displayName}</strong>
                  <small>{user.id}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {selectedUser && (
        <p className="cc-selected" role="status">
          <span aria-hidden="true">✓</span> {selectedUser.displayName}{' '}
          ausgewählt
        </p>
      )}
    </div>
  );
}
