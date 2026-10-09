import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { ApiClient } from './api';
import { App } from './app';
import './style.css';

const mount = document.getElementById('cloud-chess-root');

if (mount) {
  const apiBase = mount.dataset.apiBase;
  const requestToken = mount.dataset.requestToken;

  if (apiBase && requestToken) {
    createRoot(mount).render(
      <StrictMode>
        <App api={new ApiClient(apiBase, requestToken)} />
      </StrictMode>,
    );
  }
}
