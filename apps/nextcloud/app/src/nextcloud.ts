import { ApiClient } from './api';

export function getRootElement(): HTMLElement {
  const rootElement = document.getElementById('cloud-chess-root');
  if (!rootElement) throw new Error('React root element fehlt.');
  return rootElement;
}

export function readConfig(rootElement = getRootElement()) {
  const { apiBase, requestToken } = rootElement.dataset;
  if (!apiBase || !requestToken) {
    throw new Error('Die Nextcloud-Konfiguration fehlt.');
  }
  return {
    apiBase,
    requestToken,
    appBase: apiBase.replace(/\/api\/?$/, '') || '/',
  };
}

let apiClient: ApiClient | undefined;

export function getApiClient(): ApiClient {
  if (!apiClient) {
    const { apiBase, requestToken } = readConfig();
    apiClient = new ApiClient(apiBase, requestToken);
  }
  return apiClient;
}
