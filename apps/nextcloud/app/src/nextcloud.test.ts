// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import axios from '@nextcloud/axios';
import { getApiClient, getRootElement } from './nextcloud';
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it('keeps the Nextcloud subdirectory and index.php prefix in API URLs', async () => {
  vi.stubGlobal('_oc_webroot', '/nextcloud');
  const get = vi
    .spyOn(axios, 'get')
    .mockResolvedValue({ data: { userId: 'bob', invitations: [] } });
  await getApiClient().listInvitations();
  expect(get).toHaveBeenCalledWith(
    '/nextcloud/index.php/apps/cloud_chess/api/invitations',
  );
});
it('fails clearly when the mount element is missing', () => {
  expect(() => getRootElement()).toThrow('Cloud-Chess-Wurzelelement fehlt.');
});
