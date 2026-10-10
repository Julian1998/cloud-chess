import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { getApiClient, getRootElement } from './nextcloud';
import '@nextcloud/dialogs/style.css';
import './style.css';

createApp(App, { api: getApiClient() })
  .use(createPinia())
  .mount(getRootElement());
