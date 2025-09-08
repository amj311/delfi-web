import { ref } from 'vue'
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
		window.removeEventListener('touchstart', detectTouch);
	}
	window.addEventListener('touchstart', detectTouch);

	return {
		isTouch,
	};
})
