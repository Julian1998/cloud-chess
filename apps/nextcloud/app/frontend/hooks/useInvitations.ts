import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiClient, CreateInvitation, Invitation } from '../api';
import { errorMessage } from '../lib/errors';

export function useInvitations(api: ApiClient) {
  const [userId, setUserId] = useState('');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyInvitation, setBusyInvitation] = useState<string | null>(null);
  const loadSequence = useRef(0);

  const refresh = useCallback(
    async (initial = false) => {
      const sequence = ++loadSequence.current;
      if (initial) setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const result = await api.listInvitations();
        if (sequence !== loadSequence.current) return;
        setUserId(result.userId);
        setInvitations(result.invitations);
      } catch (failure) {
        if (sequence === loadSequence.current) setError(errorMessage(failure));
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
    void refresh(true);
    return () => {
      loadSequence.current++;
    };
  }, [refresh]);

  async function createInvitation(data: CreateInvitation): Promise<boolean> {
    setError(null);
    setNotice(null);
    try {
      const result = await api.createInvitation(data);
      setNotice(
        result.warning ??
          `Einladung an ${result.invitation.opponentName} wurde gesendet.`,
      );
      await refresh();
      return true;
    } catch (failure) {
      setError(errorMessage(failure));
      return false;
    }
  }

  async function respondToInvitation(
    invitation: Invitation,
    action: 'accept' | 'decline',
  ) {
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
      await refresh();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusyInvitation(null);
    }
  }

  return {
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
  };
}
