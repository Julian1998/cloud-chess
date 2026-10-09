// @vitest-environment jsdom
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { expect, it, vi } from 'vitest';
import { ApiClient } from '../api';
import axios from '@nextcloud/axios';
import { useInvitations } from './useInvitations';

vi.mock('@nextcloud/dialogs', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showWarning: vi.fn(),
}));

it('ignores a stale list response after a newer refresh has completed', async () => {
  let resolveOld!: (response: {
    data: { userId: string; invitations: [] };
  }) => void;
  const oldRequest = new Promise<{ data: { userId: string; invitations: [] } }>(
    (resolve) => {
      resolveOld = resolve;
    },
  );
  vi.spyOn(axios, 'get')
    .mockReturnValueOnce(oldRequest)
    .mockResolvedValueOnce({ data: { userId: 'bob', invitations: [] } });
  let state!: ReturnType<typeof useInvitations>;
  const wrapper = mount(
    defineComponent({
      setup() {
        state = useInvitations(new ApiClient('/api'));
        return () => null;
      },
    }),
  );
  try {
    await state.refresh();
    expect(state.userId.value).toBe('bob');
    resolveOld({ data: { userId: 'stale-user', invitations: [] } });
    await flushPromises();
    expect(state.loading.value).toBe(false);
    expect(state.userId.value).toBe('bob');
  } finally {
    wrapper.unmount();
    vi.restoreAllMocks();
  }
});
