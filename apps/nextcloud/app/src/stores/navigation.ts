import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useInvitationsStore } from './invitations';
import { useGamesStore } from './games';
import type { InvitationsView } from '../types/navigation';

export const useNavigationStore = defineStore('navigation', () => {
  const invitations = useInvitationsStore();
  const games = useGamesStore();
  const composing = ref(false);
  const settingsOpen = ref(false);
  const view = ref<InvitationsView>('received');
  const selectedId = ref<string | null | undefined>(undefined);
  const inboxOpen = ref(true);
  watch(
    () => invitations.userId,
    (id) => {
      if (!id) return;
      try {
        const key = `chess:${id}:inbox-open`;
        const previousKey = `cloud-chess:${id}:inbox-open`;
        const saved = localStorage.getItem(key);
        const previous = localStorage.getItem(previousKey);
        inboxOpen.value = (saved ?? previous) !== 'false';
        if (previous !== null) {
          if (saved === null) localStorage.setItem(key, previous);
          localStorage.removeItem(previousKey);
        }
      } catch {
        /* Navigation also works without storage. */
      }
    },
  );
  watch(inboxOpen, (open) => {
    if (!invitations.userId) return;
    try {
      localStorage.setItem(
        `chess:${invitations.userId}:inbox-open`,
        String(open),
      );
    } catch {
      /* Navigation also works without storage. */
    }
  });
  const selected = computed(() =>
    view.value === 'received' && selectedId.value !== null
      ? (invitations.incoming.find(({ id }) => id === selectedId.value) ??
        invitations.incoming[0])
      : invitations.invitations.find(({ id }) => id === selectedId.value),
  );
  const visibleInvitations = computed(
    () =>
      ({
        received: invitations.incoming,
        sent: invitations.sent,
        games: games.sourceInvitations,
        history: invitations.history,
      })[view.value],
  );
  return {
    composing,
    settingsOpen,
    view,
    selectedId,
    inboxOpen,
    selected,
    visibleInvitations,
  };
});
