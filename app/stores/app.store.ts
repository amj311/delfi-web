import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import request from '@/services/request';

let swRegistration;

function isTouchDevice() {
	return (('ontouchstart' in window) ||
		(navigator.maxTouchPoints > 0) ||
		// @ts-ignore
		(navigator.msMaxTouchPoints > 0));
}

export const useAppStore = defineStore('app', () => {
	const isTouch = ref<boolean>(isTouchDevice());
	function detectTouch() {
		if (isTouch.value) return;
		isTouch.value = true;
	}
	window.addEventListener('touchstart', detectTouch);

	const isMobile = ref(false);

	/**
	 * Checks if the device is mobile based on screen width
	 */
	function checkMobileScreen() {
		isMobile.value = window.innerWidth < 576;
	}

	checkMobileScreen();
	window.addEventListener('resize', checkMobileScreen);

	watch(isTouch, (newVal) => {
		if (newVal) {
			document.body.classList.add('touch');
		} else {
			document.body.classList.remove('touch');
		}
	}, { immediate: true });

	const navDrawerOpen = ref(false);


	// NOTIFICATIONS!!!!!
	const notificationPermission = ref(Notification?.permission);
	const hasNotificationPermission = computed(() => {
		return notificationPermission.value === 'granted';
	})

	function canNotification() {
		if ('Notification' in window) {
			return true;
		}
		console.log('This browser does not support desktop notification');
		return false;
	}

	function canRequestNotification() {
		if (!canNotification()) return false;
		return Notification.permission !== 'denied';
	}

	async function askNotificationPermission() {
		if (!canNotification()) return;
		const permission = await Notification.requestPermission();
		notificationPermission.value = permission;
		return permission;
	}

	function notify(title, options) {
		if (!document.hidden || !hasNotificationPermission.value) {
			console.log('Choosing not to display notification');
			return;
		};

		const finalOptions = {
			icon: '/blue.png',
			badge: '/blue.png',
			...options,
		}

		const notification = swRegistration ? swRegistration.showNotification(title, finalOptions) : new Notification(title, finalOptions);
		notification.onclick = () => {
			window.focus();
			notification.close();
		}
	}

	async function getPushSubscription() {
		if (!swRegistration) {
			swRegistration = await registerServiceWorker();
		}
		// const existingSub = await swRegistration?.pushManager.getSubscription();
		// if (existingSub) {
		// 	await existingSub.unsubscribe();
		// }
		const options = { applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY, userVisibleOnly: true };
		await swRegistration.pushManager.subscribe(options);
		const sub = await swRegistration?.pushManager.getSubscription();
		// register sub to user
		await request.post('/user/push_sub', sub);
		return sub;
	}

	return {
		isTouch,
		isMobile,
		navDrawerOpen,
		toggleDrawer() {
			navDrawerOpen.value = !navDrawerOpen.value;
		},

		canNotification,
		hasNotificationPermission,
		askNotificationPermission,
		getPushSubscription,
	};
})





const check = () => {
	if (!('serviceWorker' in navigator)) {
		console.log('No Service Worker support!')
		return false;
	}
	if (!('PushManager' in window)) {
		console.log('No Push API Support!')
		return false;
	}
	return true;
}
const registerServiceWorker = async () => {
	swRegistration = await navigator?.serviceWorker?.register('serviceworker.js'); //notice the file name
	return swRegistration;
}

const main = async () => {
	if (!check()) return;
	swRegistration = await registerServiceWorker();
}
main();
