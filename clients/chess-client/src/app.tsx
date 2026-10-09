import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { FormEvent } from 'react';

import type {
  ApiClient,
  ColorPreference,
  Invitation,
  TurnDuration,
  User,
} from './api';

type InvitationGroups = {
  received: Invitation[];
  sent: Invitation[];
};

type Tab = keyof InvitationGroups;

const dateTime = new Intl.DateTimeFormat('de-DE', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const statusLabels: Record<Invitation['status'], string> = {
  pending: 'Offen',
  accepted: 'Angenommen',
  declined: 'Abgelehnt',
  cancelled: 'Zurückgezogen',
  expired: 'Abgelaufen',
};

const colorLabels: Record<ColorPreference, string> = {
  white: 'Weiß',
  black: 'Schwarz',
  random: 'Zufällig',
};

const durationLabels: Record<TurnDuration, string> = {
  P1D: '1 Tag pro Zug',
  P2D: '2 Tage pro Zug',
};

export function splitInvitations(
  invitations: Invitation[],
  userId: string,
): InvitationGroups {
  return {
    received: invitations.filter(({ opponentId }) => opponentId === userId),
    sent: invitations.filter(({ challengerId }) => challengerId === userId),
  };
}

function messageFrom(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Etwas ist schiefgelaufen. Bitte versuche es erneut.';
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateTime.format(date);
}

function playerName(invitation: Invitation, playerId: string): string {
  if (playerId === invitation.challengerId) return invitation.challengerName;
  if (playerId === invitation.opponentId) return invitation.opponentName;
  return playerId;
}

type InvitationCardProps = {
  invitation: Invitation;
  received: boolean;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
};

function InvitationCard({
  invitation,
  received,
  busy,
  onAccept,
  onDecline,
}: InvitationCardProps) {
  const otherPlayer = received
    ? invitation.challengerName
    : invitation.opponentName;

  return (
    <article className="cc-invitation">
      <div className="cc-invitation__heading">
        <div>
          <span className="cc-kicker">{received ? 'Von' : 'An'}</span>
          <h3>{otherPlayer}</h3>
        </div>
        <span className={`cc-status cc-status--${invitation.status}`}>
          {statusLabels[invitation.status]}
        </span>
      </div>

      <dl className="cc-details">
        <div>
          <dt>{received ? 'Wunschfarbe des Gegners' : 'Deine Wunschfarbe'}</dt>
          <dd>{colorLabels[invitation.colorPreference]}</dd>
        </div>
        <div>
          <dt>Zugzeit</dt>
          <dd>{durationLabels[invitation.turnDuration]}</dd>
        </div>
        <div>
          <dt>Erstellt</dt>
          <dd>{formatDate(invitation.createdAt)}</dd>
        </div>
        {invitation.status === 'pending' && (
          <div>
            <dt>Gültig bis</dt>
            <dd>{formatDate(invitation.expiresAt)}</dd>
          </div>
        )}
      </dl>

      {invitation.game && (
        <section className="cc-game" aria-label="Partieübersicht">
          <span className="cc-game__icon" aria-hidden="true">
            ♞
          </span>
          <div>
            <strong>Partie angelegt</strong>
            <p>
              Weiß: {playerName(invitation, invitation.game.whitePlayerId)} ·
              Schwarz: {playerName(invitation, invitation.game.blackPlayerId)}
            </p>
            <p>Erste Zugfrist: {formatDate(invitation.game.turnDeadline)}</p>
            <p>Das spielbare Schachbrett folgt im nächsten Schritt.</p>
          </div>
        </section>
      )}

      {received && invitation.status === 'pending' && (
        <div className="cc-actions">
          <button
            className="cc-button cc-button--primary"
            type="button"
            disabled={busy}
            onClick={onAccept}
          >
            {busy ? 'Wird verarbeitet …' : 'Annehmen'}
          </button>
          <button
            className="cc-button cc-button--secondary"
            type="button"
            disabled={busy}
            onClick={onDecline}
          >
            Ablehnen
          </button>
        </div>
      )}
    </article>
  );
}

export function App({ api }: { api: ApiClient }) {
  const searchId = useId();
  const [userId, setUserId] = useState('');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('received');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedSearch, setSelectedSearch] = useState('');
  const loadSequence = useRef(0);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [colorPreference, setColorPreference] =
    useState<ColorPreference>('random');
  const [turnDuration, setTurnDuration] = useState<TurnDuration>('P1D');
  const [submitting, setSubmitting] = useState(false);
  const [busyInvitation, setBusyInvitation] = useState<string | null>(null);

  const loadInvitations = useCallback(
    async (initial = false) => {
      const sequence = ++loadSequence.current;
      initial ? setLoading(true) : setRefreshing(true);
      setError(null);
      try {
        const result = await api.listInvitations();
        if (sequence !== loadSequence.current) return;
        setUserId(result.userId);
        setInvitations(result.invitations);
      } catch (loadError) {
        if (sequence === loadSequence.current) setError(messageFrom(loadError));
      } finally {
        if (sequence === loadSequence.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [api],
  );

  useEffect(() => {
    void loadInvitations(true);
  }, [loadInvitations]);

  useEffect(() => {
    const search = query.trim();
    if (selectedUser?.displayName === search || search.length < 2) {
      setUsers([]);
      setSearching(false);
      setSearchError(null);
      return;
    }

    let active = true;
    setSearching(true);
    setSearchError(null);
    const timer = window.setTimeout(() => {
      void api
        .searchUsers(search)
        .then((result) => {
          if (active) setUsers(result.users);
        })
        .catch((searchFailure: unknown) => {
          if (active) setSearchError(messageFrom(searchFailure));
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

  const groups = useMemo(
    () => splitInvitations(invitations, userId),
    [invitations, userId],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUser) {
      setError('Bitte wähle zuerst eine Person aus der Suche aus.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const result = await api.createInvitation({
        opponentId: selectedUser.id,
        opponentSearch: selectedSearch,
        colorPreference,
        turnDuration,
      });
      setNotice(
        result.warning ??
          `Einladung an ${selectedUser.displayName} wurde gesendet.`,
      );
      setQuery('');
      setSelectedUser(null);
      setUsers([]);
      setTab('sent');
      await loadInvitations();
    } catch (submitError) {
      setError(messageFrom(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  async function respond(invitation: Invitation, action: 'accept' | 'decline') {
    setBusyInvitation(invitation.id);
    setError(null);
    setNotice(null);
    try {
      const result =
        action === 'accept'
          ? await api.acceptInvitation(invitation.id)
          : await api.declineInvitation(invitation.id);
      setNotice(
        result.warning ??
          (action === 'accept'
            ? 'Einladung angenommen. Die Partie wurde angelegt.'
            : 'Einladung abgelehnt.'),
      );
      await loadInvitations();
    } catch (responseError) {
      setError(messageFrom(responseError));
    } finally {
      setBusyInvitation(null);
    }
  }

  return (
    <main id="app-content" className="cc-shell">
      <header className="cc-header">
        <div>
          <span className="cc-eyebrow">Cloud Chess</span>
          <h1>Schachpartien, Zug für Zug.</h1>
          <p>Fordere jemanden heraus und spiele in deinem eigenen Tempo.</p>
        </div>
        <button
          className="cc-button cc-button--secondary cc-refresh"
          type="button"
          disabled={refreshing || loading}
          onClick={() => void loadInvitations()}
          aria-label="Einladungen aktualisieren"
        >
          <span aria-hidden="true">↻</span>{' '}
          {refreshing ? 'Aktualisiere …' : 'Aktualisieren'}
        </button>
      </header>

      {error && (
        <div className="cc-message cc-message--error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void loadInvitations()}>
            Erneut versuchen
          </button>
        </div>
      )}
      {notice && (
        <div className="cc-message cc-message--success" role="status">
          {notice}
        </div>
      )}

      <div className="cc-layout">
        <section
          className="cc-panel cc-compose"
          aria-labelledby="cc-compose-title"
        >
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
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setSelectedUser(null);
                    setUsers([]);
                  }}
                />
              </div>
              <small id={`${searchId}-hint`}>
                Gib mindestens zwei Zeichen ein.
              </small>
              {searching && <p className="cc-search-state">Suche läuft …</p>}
              {searchError && (
                <p
                  className="cc-search-state cc-search-state--error"
                  role="alert"
                >
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
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSearch(query.trim());
                          setSelectedUser(user);
                          setQuery(user.displayName);
                          setUsers([]);
                        }}
                      >
                        <span className="cc-avatar" aria-hidden="true">
                          {user.displayName
                            .trim()
                            .slice(0, 1)
                            .toLocaleUpperCase('de')}
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

        <section className="cc-panel cc-inbox" aria-labelledby="cc-inbox-title">
          <div className="cc-panel__heading">
            <span className="cc-panel__number" aria-hidden="true">
              02
            </span>
            <div>
              <h2 id="cc-inbox-title">Einladungen</h2>
              <p>Deine offenen und vergangenen Herausforderungen.</p>
            </div>
          </div>

          <div className="cc-tabs" role="tablist" aria-label="Einladungsarten">
            {(['received', 'sent'] as const).map((value) => (
              <button
                key={value}
                id={`cc-tab-${value}`}
                type="button"
                role="tab"
                aria-selected={tab === value}
                aria-controls={`cc-panel-${value}`}
                onClick={() => setTab(value)}
              >
                {value === 'received' ? 'Erhalten' : 'Gesendet'}
                <span>{groups[value].length}</span>
              </button>
            ))}
          </div>

          <div
            id={`cc-panel-${tab}`}
            role="tabpanel"
            aria-labelledby={`cc-tab-${tab}`}
            className="cc-list"
          >
            {loading ? (
              <div className="cc-empty" aria-live="polite">
                <span className="cc-spinner" aria-hidden="true" />
                Einladungen werden geladen …
              </div>
            ) : groups[tab].length === 0 ? (
              <div className="cc-empty">
                <span aria-hidden="true">♙</span>
                <strong>
                  {tab === 'received'
                    ? 'Noch keine Einladungen'
                    : 'Noch nichts gesendet'}
                </strong>
                <p>
                  {tab === 'received'
                    ? 'Neue Herausforderungen erscheinen hier.'
                    : 'Nutze das Formular, um eine Partie zu starten.'}
                </p>
              </div>
            ) : (
              groups[tab].map((invitation) => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  received={tab === 'received'}
                  busy={busyInvitation === invitation.id}
                  onAccept={() => void respond(invitation, 'accept')}
                  onDecline={() => void respond(invitation, 'decline')}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
