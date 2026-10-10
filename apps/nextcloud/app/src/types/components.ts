import type { ApiClient } from '../api';
import type {
  Invitation,
  User,
  CreateInvitation,
  InvitationAction,
} from './invitations';
import type { InvitationsView } from './navigation';

export type AppProps = { api: ApiClient };

export type PageTemplateProps = {
  title: string;
  description: string;
  refreshing: boolean;
  loading: boolean;
  error: string | null;
  notice: string | null;
};

export type PageTemplateEvents = { refresh: [] };

export type AppIconProps = {
  name:
    | 'add'
    | 'invitation'
    | 'open-invitation'
    | 'chevron-up'
    | 'chevron-down'
    | 'refresh'
    | 'back'
    | 'accept'
    | 'decline'
    | 'empty-invitation'
    | 'games'
    | 'settings';
};

export type InvitationFormProps = {
  api: ApiClient;
  onCreate: (data: CreateInvitation) => Promise<boolean>;
  error: string | null;
};

export type InvitationFormEvents = { close: [] };

export type InvitationCardProps = {
  invitation: Invitation;
  received: boolean;
  busy: boolean;
};

export type InvitationCardEvents = { accept: []; decline: [] };

export type SidebarNavigationProps = {
  view: InvitationsView;
  selectedId?: string;
  incoming: Invitation[];
  loading: boolean;
  busyInvitation: string | null;
};

export type SidebarNavigationEvents = {
  navigate: [view: InvitationsView];
  compose: [];
  settings: [];
  select: [invitation: Invitation];
  respond: [invitation: Invitation, action: InvitationAction];
};

export type InvitationListProps = {
  invitations: Invitation[];
  userId: string;
  kind: InvitationsView;
  loading: boolean;
  busyInvitation: string | null;
};

export type InvitationListEvents = {
  select: [invitation: Invitation];
  respond: [invitation: Invitation, action: InvitationAction];
  compose: [];
};

export type AppShellProps = { api: ApiClient };

export type InvitationResponseActionsProps = {
  busy: boolean;
  disabled: boolean;
};

export type InvitationResponseActionsEvents = { accept: []; decline: [] };

export type InvitationQuickActionsProps = {
  playerName: string;
  disabled: boolean;
};

export type InvitationQuickActionsEvents = {
  respond: [action: InvitationAction];
};

export type InvitationNavigationItemProps = {
  invitation: Invitation;
  active: boolean;
  loading: boolean;
  disabled: boolean;
};

export type InvitationNavigationItemEvents = {
  select: [invitation: Invitation];
  respond: [invitation: Invitation, action: InvitationAction];
};

export type UserSearchProps = {
  api: ApiClient;
  query: string;
  selectedUser: User | null;
  disabled: boolean;
};

export type UserSearchEvents = {
  'update:query': [value: string];
  select: [user: User | null];
};

export type InvitationRowProps = {
  invitation: Invitation;
  userId: string;
  kind: InvitationsView;
  busy: boolean;
  disabled: boolean;
};

export type InvitationRowEvents = {
  select: [invitation: Invitation];
  respond: [invitation: Invitation, action: InvitationAction];
};

export type PageHeaderProps = {
  title: string;
  description: string;
  refreshing: boolean;
  loading: boolean;
};

export type PageHeaderEvents = { refresh: [] };

export type InvitationTabsProps = { view: InvitationsView };

export type InvitationTabsEvents = { navigate: [view: InvitationsView] };
