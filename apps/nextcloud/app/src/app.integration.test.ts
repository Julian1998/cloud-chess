// @vitest-environment jsdom
import {
  mount,
  flushPromises,
  DOMWrapper,
  type VueWrapper,
} from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { ApiClient, type Invitation } from './api';
import App from './App.vue';
import axios from '@nextcloud/axios';
import { showSuccess } from '@nextcloud/dialogs';
import { subscribe, unsubscribe } from '@nextcloud/event-bus';

const mobile = vi.hoisted(() => ({ value: false }));
vi.mock('@nextcloud/vue/composables/useIsMobile', () => ({
  useIsMobile: () => mobile,
}));

vi.mock('@nextcloud/dialogs', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showWarning: vi.fn(),
}));
// Nextcloud supplies these containers at runtime; test invitation interactions here.
vi.mock('@nextcloud/vue/components/NcAppNavigation', () => ({
  default: {
    template:
      '<nav><slot name="search" /><slot /><slot name="list" /><slot name="footer" /></nav>',
  },
}));
vi.mock('@nextcloud/vue/components/NcAppContent', () => ({
  default: { template: '<div><slot /></div>' },
}));
vi.mock('@nextcloud/vue/components/NcAppNavigationItem', () => ({
  default: {
    props: ['name', 'active'],
    emits: ['click'],
    template:
      '<div><button :aria-pressed="active" @click="$emit(\'click\')">{{name}}</button><slot name="actions" /><slot name="extra" /><slot /></div>',
  },
}));
vi.mock('@nextcloud/vue/components/NcButton', () => ({
  default: {
    props: ['disabled', 'type'],
    template:
      '<button :disabled="disabled" :type="type || \'button\'"><slot /></button>',
  },
}));

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

const capabilities = document.createElement('input');
capabilities.type = 'hidden';
capabilities.id = 'initial-state-core-capabilities';
capabilities.value = btoa(JSON.stringify({ user_status: { enabled: false } }));
document.body.append(capabilities);

const originalAdapter = axios.defaults.adapter;
function mockApi(
  handler: (url: string, options: RequestInit) => Promise<Response>,
) {
  axios.defaults.adapter = async (config) => {
    const response = await handler(config.url!, {
      method: config.method?.toUpperCase(),
      body: config.data,
    });
    return {
      data: await response.json(),
      status: response.status,
      statusText: response.statusText,
      headers: {},
      config,
    };
  };
}

let wrapper: VueWrapper | undefined;
afterEach(() => {
  mobile.value = false;
  localStorage.clear();
  wrapper?.unmount();
  axios.defaults.adapter = originalAdapter;
  vi.restoreAllMocks();
});
function render() {
  wrapper = mount(App, {
    props: { api: new ApiClient('/api') },
    global: { stubs: { teleport: true } },
  });
  return wrapper;
}
function button(label: string) {
  return wrapper!
    .findAll('button')
    .find((candidate) => candidate.text().includes(label))!;
}

it.each(['accept', 'decline'] as const)(
  'answers directly from the sidebar using %s',
  async (action) => {
    let invitation = { ...pending };
    const request = vi.fn(async (url: string) => {
      if (url.endsWith('/' + action)) {
        invitation = {
          ...invitation,
          status: action === 'accept' ? 'accepted' : 'declined',
        };
        return Response.json({ invitation });
      }
      return Response.json({ userId: 'bob', invitations: [invitation] });
    });
    mockApi(request);
    render();
    await flushPromises();
    const label = action === 'accept' ? 'Annehmen' : 'Ablehnen';
    await wrapper!
      .find(`nav button[aria-label="${label}: Alice"]`)
      .trigger('click');
    await flushPromises();
    expect(
      request.mock.calls.some(([url]) => url.endsWith('/invite-1/' + action)),
    ).toBe(true);
    expect(
      wrapper!.find('nav button[aria-label="Annehmen: Alice"]').exists(),
    ).toBe(false);
  },
);

it.each(['accept', 'decline'] as const)(
  'resolves an incoming invitation through the inbox %s action',
  async (action) => {
    let invitation = { ...pending };
    mockApi(async (url: string) => {
      if (url.endsWith('/' + action)) {
        invitation = {
          ...invitation,
          status: action === 'accept' ? 'accepted' : 'declined',
        };
        return Response.json({ invitation });
      }
      return Response.json({ userId: 'bob', invitations: [invitation] });
    });
    render();
    await flushPromises();
    await button(action === 'accept' ? 'Annehmen' : 'Ablehnen').trigger(
      'click',
    );
    await flushPromises();
    expect(wrapper!.text()).toContain(
      action === 'accept' ? 'Einladung angenommen' : 'Einladung abgelehnt',
    );
    expect(
      wrapper!
        .findAll('button')
        .some((candidate) => candidate.text() === 'Annehmen'),
    ).toBe(false);
  },
);

it('shows a recoverable fallback when rendering fails', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  wrapper = mount(App, {
    props: { api: new ApiClient('/api') },
    global: {
      stubs: {
        InvitationsPage: {
          setup() {
            throw new Error('render failed');
          },
          template: '<div />',
        },
      },
    },
  });
  await flushPromises();
  expect(wrapper.find('[role="alert"]').text()).toContain(
    'Cloud Chess konnte nicht geladen werden.',
  );
  expect(button('Seite neu laden').exists()).toBe(true);
});

it('keeps server search results selectable with trailing whitespace and preserves the discovery term', async () => {
  let created: Invitation | null = null;
  let submitted: unknown;
  mockApi(async (url: string, options?: RequestInit) => {
    if (url.includes('/users?'))
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
  });
  render();
  await flushPromises();
  await button('Neue Partie').trigger('click');
  expect(wrapper!.find('[role="dialog"]').exists()).toBe(true);
  await wrapper!.find('input[role="combobox"]').trigger('focus');
  await wrapper!.find('input[role="combobox"]').setValue('ali ');
  await vi.waitFor(() =>
    expect(document.querySelector('[role="option"]')).not.toBeNull(),
  );
  await new DOMWrapper(document.querySelector('[role="option"]')!).trigger(
    'click',
  );
  await wrapper!.find('form').trigger('submit');
  await flushPromises();
  expect(submitted).toEqual({
    opponentId: 'alice',
    opponentSearch: 'ali',
    colorPreference: 'random',
    turnDuration: 'P1D',
  });
  expect(wrapper!.text()).toContain('Einladung an Alice wurde gesendet.');
  expect(showSuccess).toHaveBeenCalledWith(
    'Einladung an Alice wurde gesendet.',
  );
  expect(wrapper!.find('[role="dialog"]').exists()).toBe(false);
});

it('opens an existing game from the games view', async () => {
  const invitation: Invitation = {
    ...pending,
    status: 'accepted',
    game: {
      id: 'invite-1',
      whitePlayerId: 'alice',
      blackPlayerId: 'bob',
      turnDeadline: '2026-10-10T10:00:00Z',
    },
  };
  mockApi(async () =>
    Response.json({ userId: 'bob', invitations: [invitation] }),
  );
  render();
  await flushPromises();
  await button('Alle Partien').trigger('click');
  await wrapper!.find('.cc-invitation-row a').trigger('click');
  expect(wrapper!.findAll('.cc-invitation')).toHaveLength(1);
  expect(wrapper!.find('[aria-label="Partieübersicht"] dl').text()).toContain(
    'WeißAliceSchwarzBob',
  );
  expect(wrapper!.find('.cc-invitation-heading').text()).toContain(
    'Partie angelegt',
  );
});

it('keeps a failed invitation in the dialog with the selected player and settings', async () => {
  mockApi(async (url, options) => {
    if (url.includes('/users?'))
      return Response.json({ users: [{ id: 'alice', displayName: 'Alice' }] });
    if (options.method === 'POST') throw new Error('offline');
    return Response.json({ userId: 'bob', invitations: [] });
  });
  render();
  await flushPromises();
  await button('Neue Partie').trigger('click');
  await wrapper!.find('input[role="combobox"]').trigger('focus');
  await wrapper!.find('input[role="combobox"]').setValue('ali');
  await vi.waitFor(() =>
    expect(document.querySelector('[role="option"]')).not.toBeNull(),
  );
  await new DOMWrapper(document.querySelector('[role="option"]')!).trigger(
    'click',
  );
  await wrapper!.find('form').trigger('submit');
  await flushPromises();
  const dialog = wrapper!.find('[role="dialog"]');
  expect(dialog.exists()).toBe(true);
  expect(dialog.find('[role="alert"]').text()).toContain(
    'Der Server ist nicht erreichbar',
  );
  expect(dialog.text()).toContain('Alice');
  expect(button('Einladung senden').attributes('disabled')).toBeUndefined();
});

it('selects the newest incoming request and moves to the next after declining', async () => {
  const older = { ...pending, id: 'older', challengerName: 'Carla' };
  const newer = {
    ...pending,
    id: 'newer',
    challengerName: 'Daniel',
    createdAt: '2026-10-10T10:00:00Z',
  };
  let items = [older, newer];
  mockApi(async (url) => {
    if (url.endsWith('/decline')) {
      items = items.map((item) =>
        item.id === 'newer' ? { ...item, status: 'declined' as const } : item,
      );
      return Response.json({ invitation: items[1] });
    }
    return Response.json({ userId: 'bob', invitations: items });
  });
  render();
  await flushPromises();
  expect(wrapper!.find('.cc-invitation h2').text()).toBe('Daniel');
  await button('Carla').trigger('click');
  expect(wrapper!.find('.cc-invitation h2').text()).toBe('Carla');
  await button('Daniel').trigger('click');
  await button('Ablehnen').trigger('click');
  await flushPromises();
  expect(wrapper!.find('.cc-invitation h2').text()).toBe('Carla');
  expect(wrapper!.find('nav').text()).not.toContain('Daniel');
});

it('opens the created game immediately after accepting a request', async () => {
  let invitation = { ...pending };
  mockApi(async (url) => {
    if (url.endsWith('/accept')) {
      invitation = {
        ...pending,
        status: 'accepted',
        game: {
          id: pending.id,
          whitePlayerId: 'alice',
          blackPlayerId: 'bob',
          turnDeadline: '2026-10-11T10:00:00Z',
        },
      };
      return Response.json({ invitation });
    }
    return Response.json({ userId: 'bob', invitations: [invitation] });
  });
  render();
  await flushPromises();
  await button('Annehmen').trigger('click');
  await flushPromises();
  expect(wrapper!.find('[aria-label="Partieübersicht"]').exists()).toBe(true);
  expect(wrapper!.find('nav').text()).not.toContain('Alice');
});

it('closes the native mobile navigation when choosing an incoming request', async () => {
  mobile.value = true;
  mockApi(async () => Response.json({ userId: 'bob', invitations: [pending] }));
  const onToggle = vi.fn();
  subscribe('toggle-navigation', onToggle);
  try {
    render();
    await flushPromises();
    await button('Alice').trigger('click');
    expect(onToggle).toHaveBeenCalledWith({ open: false });
    expect(wrapper!.find('.cc-invitation h2').text()).toBe('Alice');
  } finally {
    unsubscribe('toggle-navigation', onToggle);
  }
});

it('groups received and sent invitations under the fixed invitations destination', async () => {
  const outgoing = {
    ...pending,
    id: 'outgoing',
    challengerId: 'bob',
    opponentId: 'carla',
    opponentName: 'Carla',
  };
  mockApi(async () =>
    Response.json({ userId: 'bob', invitations: [pending, outgoing] }),
  );
  render();
  await flushPromises();
  await button('Einladungen').trigger('click');
  expect(wrapper!.find('.cc-invitation').exists()).toBe(false);
  expect(wrapper!.find('.cc-invitation-row').text()).toContain('Alice');
  await button('Gesendet').trigger('click');
  expect(wrapper!.find('.cc-invitation-row').text()).toContain('Carla');
  expect(wrapper!.find('nav').text()).not.toContain('Gesendete Einladungen');
});

it('opens native app settings and updates the flat request list', async () => {
  mockApi(async () => Response.json({ userId: 'bob', invitations: [pending] }));
  render();
  await flushPromises();
  await button('Einstellungen').trigger('click');
  expect(wrapper!.find('[role="dialog"]').exists()).toBe(true);
  const checkbox = wrapper!.find('input[type="checkbox"]');
  await checkbox.setValue(false);
  expect(wrapper!.find('#cc-open-requests').isVisible()).toBe(false);
  expect(localStorage.getItem('cloud-chess:bob:inbox-open')).toBe('false');
});
