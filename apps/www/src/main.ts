import { createApp } from 'vue';

import App from './App.vue';
import { registerPwa } from './lib/pwa';
import router from './router';

import './styles.css';

createApp(App).use(router).mount('#app');

registerPwa();
