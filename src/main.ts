import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import request from './services/request'

import App from './App.vue'
import router from './router'
import { AuthService } from './services/authService'

const app = createApp(App)

app.use(createPinia())
app.use(router);

(async () => {
	const { data } = await request.get('firebase-config');
	AuthService.setupAuth(data.data);
})()

app.mount('#app');

