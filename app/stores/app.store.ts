import { ref, watch } from 'vue'
import { defineStore } from 'pinia'


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

	return {
		isTouch,
		isMobile,
	};
})
