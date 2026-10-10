import { ApiClient } from './api';

export function getRootElement(): HTMLElement {
  const rootElement = document.getElementById('app-root');
  if (!rootElement) throw new Error('App-Wurzelelement fehlt.');
  return rootElement;
}

export function getApiClient(): ApiClient {
  return new ApiClient();
}
