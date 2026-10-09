// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { type Invitation } from './api';
import App from './App';

const pending: Invitation = {
  id: 'invite-1',
  challengerId: 'alice',
  challengerName: 'Alice',
  opponentId: 'bob',
  opponentName: 'Bob',
  colorPreference: 'white',
  turnDuration: 'P1D',
  status: 'pending',
  createdAt: '2026-10-09T10:00:00Z',
  expiresAt: '2026-10-16T10:00:00Z',
  game: null,
};

beforeEach(() => {
  const root = document.createElement('div');
  root.id = 'cloud-chess-root';
  root.dataset.apiBase = '/api';
  root.dataset.requestToken = 'test-token';
  document.body.append(root);
});

afterEach(() => {
  cleanup();
  document.getElementById('cloud-chess-root')?.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it.each(['accept', 'decline'] as const)(
  'resolves an incoming invitation through %s',
  async (action) => {
    let invitation = { ...pending };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL | Request) => {
        if (String(url).endsWith(`/${action}`)) {
          invitation = {
            ...invitation,
            status: action === 'accept' ? 'accepted' : 'declined',
          };
          return Response.json({ invitation });
        }
        return Response.json({ userId: 'bob', invitations: [invitation] });
      }),
    );

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    fireEvent.click(
      await screen.findByRole('button', {
        name: action === 'accept' ? 'Annehmen' : 'Ablehnen',
      }),
    );

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Annehmen' })).toBeNull(),
    );
    expect(
      screen.getByText(action === 'accept' ? 'Angenommen' : 'Abgelehnt'),
    ).toBeTruthy();
  },
);

it('shows a recoverable fallback when rendering the route tree fails', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ userId: 'bob', invitations: [] })),
  );
  render(<App />);

  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    expect.stringContaining('Cloud Chess konnte nicht geladen werden.'),
  );
});

it('keeps the original discovery term when sending an invitation', async () => {
  let created: Invitation | null = null;
  let submitted: Record<string, string> | undefined;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string | URL | Request, options?: RequestInit) => {
      if (String(url).includes('/users?'))
        return Response.json({
          users: [{ id: 'alice', displayName: 'Alice' }],
        });
      if (options?.method === 'POST') {
        submitted = JSON.parse(String(options.body));
        created = {
          ...pending,
          challengerId: 'bob',
          challengerName: 'Bob',
          opponentId: 'alice',
          opponentName: 'Alice',
        };
        return Response.json({ invitation: created });
      }
      return Response.json({
        userId: 'bob',
        invitations: created ? [created] : [],
      });
    }),
  );

  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  );
  fireEvent.change(
    await screen.findByRole('searchbox', { name: 'Mitspieler suchen' }),
    { target: { value: 'ali' } },
  );
  fireEvent.click(await screen.findByRole('button', { name: /Alice\s*alice/ }));
  fireEvent.click(screen.getByRole('button', { name: /Einladung senden/ }));

  expect(
    await screen.findByText('Einladung an Alice wurde gesendet.'),
  ).toBeTruthy();
  await waitFor(() =>
    expect(
      screen
        .getByRole('tab', { name: /Gesendet\s*1/ })
        .getAttribute('aria-selected'),
    ).toBe('true'),
  );
  expect(submitted).toEqual({
    opponentId: 'alice',
    opponentSearch: 'ali',
    colorPreference: 'random',
    turnDuration: 'P1D',
  });
  expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('');
});
