import { computed } from 'vue';
import { defineStore } from 'pinia';
import { useInvitationsStore } from './invitations';
import type { GameInvitation } from '../types/invitations';

export const useGamesStore = defineStore('games', () => {
  const invitations = useInvitationsStore();
  // The API currently embeds game summaries in invitation records.
  const sourceInvitations = computed(() =>
    invitations.invitations.filter(
      (invitation): invitation is GameInvitation => invitation.game !== null,
    ),
  );
  const games = computed(() => sourceInvitations.value.map(({ game }) => game));
  return { sourceInvitations, games };
});
