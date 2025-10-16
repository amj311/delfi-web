import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
import './assets/main.css'

import VueApexCharts from "vue3-apexcharts";

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router/router'
import { AuthService } from './services/authService'



import ConfirmationService from 'primevue/confirmationservice';
import Tooltip from 'primevue/tooltip';


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
app.use(VueApexCharts as any);
app.directive('tooltip', Tooltip);

(async () => {
	AuthService.setupAuth();
})()

app.mount('#app');

