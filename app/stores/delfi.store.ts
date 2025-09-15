import { computed, reactive, ref, type Reactive, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { Delfi, type DelfiConfig } from '../../delfi-core/Delfi';
import { ddate, type DelfiDate } from 'delfi-core/utils/dateUtils';
import { TransactionService } from '@/services/transaction.service';
import { useAccountStore } from './account.store';
import { useBudgetStore } from './budget.store';
import { useCategoryStore } from './category.store';

export const useDelfiStore = defineStore('delfi', () => {
	const delfi = new Delfi();
	const isInitializing: Ref<boolean> = ref(true);
	const isGeneratingForecast: Ref<boolean> = ref(false);

	const computeTimeout = ref<number | null>(null);

	// begin with a few previous months as hindsight
	const projectionStart = ref<DelfiDate>(ddate().startOf('month').subtract(3, 'month'));
	const projectionEnd = ref<DelfiDate>(ddate().startOf('month').add(5, 'year'));

	const reComputed = ref(0);

	async function initDelfi() {
		isInitializing.value = true;
		delfi.init({
			accounts: useAccountStore().accounts,
			budgets: useBudgetStore().budgets,
			categories: useCategoryStore().allCategories,
			start: projectionStart.value,
			end: projectionEnd.value,
			loadTransactions: async (start, end) => {
				return await TransactionService.getTransactionsInRange(start, end);
			}
		});
		isInitializing.value = false;
		reComputed.value += 1;
		isGeneratingForecast.value = true;
		await delfi.computeForecast();
		isGeneratingForecast.value = false;

		scheduleCompute(); // schedule another compute in case things changed while we were computing
	}

	function reCompute() {
		initDelfi().catch((error) => {
			console.error("Error during re-computation:", error);
		})
	}


	function scheduleCompute() {
		if (computeTimeout.value) {
			clearTimeout(computeTimeout.value);
		}
		computeTimeout.value = window.setTimeout(() => {
			reCompute();
		}, 60 * 60 * 1000); // every hour
	}

	return {
		delfi,
		initDelfi,
		isInitializing,
		isGeneratingForecast,
		projectionStart,
		projectionEnd,
		reCompute,
		reComputed,
	}
})
