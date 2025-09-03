import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import request from './services/request'

import App from './App.vue'
import router from './router/router'
import { AuthService } from './services/authService'



import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';

const app = createApp(App)

app.use(PrimeVue, {
	// Default theme configuration
	theme: {
		preset: Aura,
		options: {
			prefix: 'p',
			darkModeSelector: '.nothing-ever', // always dark mode
			cssLayer: false,
			ripple: true,
		}
	}
});

app.use(createPinia());
app.use(router);
app.use(ConfirmationService);
app.use(ToastService);

(async () => {
	AuthService.setupAuth();
})()

app.mount('#app');

