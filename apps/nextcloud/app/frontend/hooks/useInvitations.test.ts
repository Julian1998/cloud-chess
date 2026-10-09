// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ApiClient } from '../api';
import { useInvitations } from './useInvitations';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('ignores a stale list response after a newer refresh has completed', async () => {
  let resolveOld!: (response: Response) => void;
  const oldRequest = new Promise<Response>((resolve) => {
    resolveOld = resolve;
  });
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockReturnValueOnce(oldRequest)
      .mockResolvedValueOnce(Response.json({ userId: 'bob', invitations: [] })),
  );
  const api = new ApiClient('/api', 'token');
  const { result } = renderHook(() => useInvitations(api));
  await act(async () => {
    await result.current.refresh();
  });
  expect(result.current.userId).toBe('bob');

  await act(async () => {
    resolveOld(Response.json({ userId: 'stale-user', invitations: [] }));
  });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.userId).toBe('bob');
});
