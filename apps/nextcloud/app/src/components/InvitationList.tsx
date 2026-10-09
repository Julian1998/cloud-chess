import type { Invitation } from '../api';
import { splitInvitations, type InvitationTab } from '../lib/invitations';
import InvitationCard from './InvitationCard';

type InvitationListProps = {
  invitations: Invitation[];
  userId: string;
  tab: InvitationTab;
  loading: boolean;
  busyInvitation: string | null;
  onTabChange: (tab: InvitationTab) => void;
  onRespond: (invitation: Invitation, action: 'accept' | 'decline') => void;
};

export default function InvitationList({
  invitations,
  userId,
  tab,
  loading,
  busyInvitation,
  onTabChange,
  onRespond,
}: InvitationListProps) {
  const groups = splitInvitations(invitations, userId);
  return (
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
            onClick={() => onTabChange(value)}
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
              onAccept={() => onRespond(invitation, 'accept')}
              onDecline={() => onRespond(invitation, 'decline')}
            />
          ))
        )}
      </div>
    </section>
  );
}
