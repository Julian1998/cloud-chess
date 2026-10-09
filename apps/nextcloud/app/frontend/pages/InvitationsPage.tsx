import { useState } from 'react';
import type { CreateInvitation } from '../api';
import InvitationForm from '../components/InvitationForm';
import InvitationList from '../components/InvitationList';
import { useInvitations } from '../hooks/useInvitations';
import type { InvitationTab } from '../lib/invitations';
import { getApiClient } from '../nextcloud';

export default function InvitationsPage() {
  const api = getApiClient();
  const {
    userId,
    invitations,
    loading,
    refreshing,
    error,
    notice,
    busyInvitation,
    refresh,
    createInvitation,
    respondToInvitation,
  } = useInvitations(api);
  const [tab, setTab] = useState<InvitationTab>('received');

  async function handleCreate(data: CreateInvitation) {
    const created = await createInvitation(data);
    if (created) setTab('sent');
    return created;
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
          onClick={() => void refresh()}
          aria-label="Einladungen aktualisieren"
        >
          <span aria-hidden="true">↻</span>{' '}
          {refreshing ? 'Aktualisiere …' : 'Aktualisieren'}
        </button>
      </header>
      {error && (
        <div className="cc-message cc-message--error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void refresh()}>
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
        <InvitationForm api={api} onCreate={handleCreate} />
        <InvitationList
          invitations={invitations}
          userId={userId}
          tab={tab}
          loading={loading}
          busyInvitation={busyInvitation}
          onTabChange={setTab}
          onRespond={(invitation, action) =>
            void respondToInvitation(invitation, action)
          }
        />
      </div>
    </main>
  );
}
