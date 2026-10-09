import { ApiClient } from './api';

export function getRootElement(): HTMLElement {
  const rootElement = document.getElementById('cloud-chess-root');
  if (!rootElement) throw new Error('Cloud-Chess-Wurzelelement fehlt.');
  return rootElement;
}

export function getApiClient(): ApiClient {
  return new ApiClient();
}
