import { reactive } from 'vue'
import { defineStore } from 'pinia'
import { Delfi, type DelfiConfig } from '../../delfi-core';

export const useDelfiStore = defineStore('delfi', () => {
	let delfi = reactive(new Delfi());
	
	async function initDelfi(config: DelfiConfig) {
		delfi = reactive(new Delfi(config));
	}

	return { delfi, initDelfi };
})
