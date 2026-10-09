import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { getRootElement, readConfig } from './nextcloud';
import './style.css';

const rootElement = getRootElement();
const { appBase } = readConfig(rootElement);

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter basename={appBase}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
