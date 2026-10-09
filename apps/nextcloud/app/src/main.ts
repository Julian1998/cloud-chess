import { createApp } from 'vue';
import App from './App.vue';
import { getApiClient, getRootElement } from './nextcloud';
import '@nextcloud/dialogs/style.css';
import './style.css';

createApp(App, { api: getApiClient() }).mount(getRootElement());
