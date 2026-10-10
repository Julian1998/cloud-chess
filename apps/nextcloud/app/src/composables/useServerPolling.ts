import { onMounted, onScopeDispose } from 'vue';
import { useInvitationsStore } from '../stores/invitations';

// The persistent AppShell is the only owner of this timer.
export function useServerPolling() {
  const store = useInvitationsStore();
  let timer: ReturnType<typeof setInterval> | undefined;
  onMounted(() => {
    void store.refresh();
    timer = setInterval(() => {
      void store.refresh('poll');
    }, 20_000);
  });
  onScopeDispose(() => {
    clearInterval(timer);
    store.cancelRequests();
  });
}
