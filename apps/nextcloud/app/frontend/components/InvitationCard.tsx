import type { ColorPreference, Invitation, TurnDuration } from '../api';

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

export default function InvitationCard({
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
