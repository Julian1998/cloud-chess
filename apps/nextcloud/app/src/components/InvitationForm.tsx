import { useState, type FormEvent } from 'react';
import type {
  ApiClient,
  ColorPreference,
  CreateInvitation,
  TurnDuration,
  User,
} from '../api';
import UserSearch from './UserSearch';

type InvitationFormProps = {
  api: ApiClient;
  onCreate: (data: CreateInvitation) => Promise<boolean>;
};

export default function InvitationForm({ api, onCreate }: InvitationFormProps) {
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedSearch, setSelectedSearch] = useState('');
  const [colorPreference, setColorPreference] =
    useState<ColorPreference>('random');
  const [turnDuration, setTurnDuration] = useState<TurnDuration>('P1D');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUser || submitting) return;
    setSubmitting(true);
    try {
      const created = await onCreate({
        opponentId: selectedUser.id,
        opponentSearch: selectedSearch,
        colorPreference,
        turnDuration,
      });
      if (created) {
        setQuery('');
        setSelectedUser(null);
        setSelectedSearch('');
      }
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <section className="cc-panel cc-compose" aria-labelledby="cc-compose-title">
      <div className="cc-panel__heading">
        <span className="cc-panel__number" aria-hidden="true">
          01
        </span>
        <div>
          <h2 id="cc-compose-title">Neue Einladung</h2>
          <p>Wähle Mitspieler und Bedenkzeit.</p>
        </div>
      </div>

      <form onSubmit={(event) => void submit(event)}>
        <UserSearch
          api={api}
          query={query}
          selectedUser={selectedUser}
          onChange={(value) => {
            setQuery(value);
            setSelectedUser(null);
          }}
          onSelect={(user) => {
            setSelectedSearch(query.trim());
            setSelectedUser(user);
            setQuery(user.displayName);
          }}
        />

        <fieldset className="cc-fieldset">
          <legend>Deine Wunschfarbe</legend>
          <div className="cc-segments">
            {(
              [
                ['white', '○', 'Weiß'],
                ['random', '◐', 'Zufall'],
                ['black', '●', 'Schwarz'],
              ] as const
            ).map(([value, icon, label]) => (
              <label key={value}>
                <input
                  type="radio"
                  name="color"
                  value={value}
                  checked={colorPreference === value}
                  onChange={() => setColorPreference(value)}
                />
                <span aria-hidden="true">{icon}</span>
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="cc-fieldset">
          <legend>Zeit pro Zug</legend>
          <div className="cc-segments cc-segments--two">
            {(
              [
                ['P1D', '1 Tag'],
                ['P2D', '2 Tage'],
              ] as const
            ).map(([value, label]) => (
              <label key={value}>
                <input
                  type="radio"
                  name="duration"
                  value={value}
                  checked={turnDuration === value}
                  onChange={() => setTurnDuration(value)}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <button
          className="cc-button cc-button--primary cc-submit"
          type="submit"
          disabled={!selectedUser || submitting}
        >
          <span aria-hidden="true">♟</span>
          {submitting ? 'Wird gesendet …' : 'Einladung senden'}
        </button>
      </form>
    </section>
  );
}
