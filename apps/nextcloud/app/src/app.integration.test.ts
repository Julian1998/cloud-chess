// @vitest-environment jsdom
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { ApiClient, type Invitation } from './api';
import App from './App.vue';
import axios from '@nextcloud/axios';
import { showSuccess } from '@nextcloud/dialogs';

vi.mock('@nextcloud/dialogs', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showWarning: vi.fn(),
}));
vi.mock('@nextcloud/vue/components/NcModal', () => ({
  default: { template: '<div role="dialog"><slot /></div>' },
}));
vi.mock('@nextcloud/vue/components/NcAppNavigationCaption', () => ({
  default: { template: '<h2><slot /></h2>' },
}));
vi.mock('@nextcloud/vue/components/NcActionButton', () => ({
  default: {
    props: ['disabled'],
    template: '<button :disabled="disabled"><slot /></button>',
  },
}));

// Nextcloud supplies these containers at runtime; test invitation interactions here.
vi.mock('@nextcloud/vue/components/NcAppNavigation', () => ({
  default: { template: '<nav><slot /><slot name="list" /></nav>' },
}));
vi.mock('@nextcloud/vue/components/NcAppContent', () => ({
  default: { template: '<div><slot /></div>' },
}));
vi.mock('@nextcloud/vue/components/NcAppNavigationItem', () => ({
  default: {
    props: ['name', 'active'],
    template:
      '<div><button :aria-pressed="active">{{name}}</button><slot name="actions" /></div>',
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
  wrapper?.unmount();
  axios.defaults.adapter = originalAdapter;
  vi.restoreAllMocks();
});
function render() {
  wrapper = mount(App, { props: { api: new ApiClient('/api') } });
  return wrapper;
}
function button(label: string) {
  return wrapper!
    .findAll('button')
    .find((candidate) => candidate.text().includes(label))!;
}

it.each(['accept', 'decline'] as const)(
  'resolves an incoming invitation through the sidebar %s action',
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
    await wrapper!
      .find('nav')
      .findAll('button')
      .find(
        (candidate) =>
          candidate.text() === (action === 'accept' ? 'Annehmen' : 'Ablehnen'),
      )!
      .trigger('click');
    await flushPromises();
    expect(wrapper!.text()).toContain(
      action === 'accept' ? 'Angenommen' : 'Abgelehnt',
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

it('keeps the original discovery term when sending an invitation', async () => {
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
  await wrapper!.find('input[type="search"]').setValue('ali');
  await vi.waitFor(() => expect(button('Alice')).toBeTruthy());
  await button('Alice').trigger('click');
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

it('selects an existing game from the sidebar', async () => {
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
  await wrapper!
    .find('nav')
    .findAll('button')
    .find((candidate) => candidate.text() === 'Alice')!
    .trigger('click');
  expect(wrapper!.findAll('.cc-invitation')).toHaveLength(1);
  expect(wrapper!.find('[aria-label="Partieübersicht"]').text()).toContain(
    'Weiß: Alice · Schwarz: Bob',
  );
  expect(wrapper!.find('[aria-label="Partieübersicht"]').text()).toContain(
    'Partie angelegt',
  );
});
