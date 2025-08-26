import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Delfi } from 'delfi-core/Delfi';

export const useContextStore = defineStore('context', () => {
	let currentSummary = ref<any>(null);

	return {
		currentSummary,
		setCurrentSummary(summary: any) {
			currentSummary.value = summary;
		}
	};
})
