import { computed, reactive, ref, type Reactive, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { Delfi, type DelfiConfig } from '../../delfi-core/Delfi';
import { date } from 'delfi-core/utils/dateUtils';

export const useDelfiStore = defineStore('delfi', () => {
	const delfi = new Delfi();
	const isInitializing: Ref<boolean> = ref(true);
	const isGeneratingForecast: Ref<boolean> = ref(false);

	const projectionStart = computed(() => date().startOf('month'));
	const projectionEnd = computed(() => date(projectionStart.value).add(5, 'year'));

	async function initDelfi({
		accounts = [] as DelfiConfig['accounts'],
		budgets = [] as DelfiConfig['budgets'],
		categories = [] as DelfiConfig['categories'],
	}) {
		isInitializing.value = true;
		delfi.init({
			accounts,
			budgets,
			categories,
			start: projectionStart.value,
			end: projectionEnd.value,
		});
		isInitializing.value = false;
		isGeneratingForecast.value = true;
		await delfi.computeForecast();
		isGeneratingForecast.value = false;
	}

	return {
		delfi,
		initDelfi,
		isInitializing,
		isGeneratingForecast,
		projectionStart,
		projectionEnd,
	}
})
