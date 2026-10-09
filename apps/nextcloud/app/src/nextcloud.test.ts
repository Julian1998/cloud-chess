// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { readConfig } from './nextcloud';

it('keeps the Nextcloud subdirectory and index.php prefix in the router base', () => {
  const root = document.createElement('div');
  root.dataset.apiBase = '/nextcloud/index.php/apps/cloud_chess/api';
  root.dataset.requestToken = 'csrf-token';
  expect(readConfig(root)).toEqual({
    apiBase: '/nextcloud/index.php/apps/cloud_chess/api',
    requestToken: 'csrf-token',
    appBase: '/nextcloud/index.php/apps/cloud_chess',
  });
});

it('fails clearly when the host configuration is missing', () => {
  expect(() => readConfig(document.createElement('div'))).toThrow(
    'Die Nextcloud-Konfiguration fehlt.',
  );
});
