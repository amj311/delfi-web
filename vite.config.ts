import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		vueJsx(),
	],
	resolve: {
		alias: {
			'delfi-core': fileURLToPath(new URL('./delfi-core', import.meta.url)),
			'@': fileURLToPath(new URL('./src', import.meta.url))
		}
	},
	server: {
		https: {
			key: fileURLToPath(new URL('./server/certs/localhost+2-key.pem', import.meta.url)),
			cert: fileURLToPath(new URL('./server/certs/localhost+2.pem', import.meta.url)),
		}
	},
})
