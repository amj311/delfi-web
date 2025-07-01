import { computed, reactive, ref, type Reactive, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { Delfi, type DelfiConfig } from '../../delfi-core/Delfi';
import { date, type DelfiDate } from 'delfi-core/utils/dateUtils';
import { TransactionService } from '@/services/transaction.service';
import { useAccountStore } from './account.store';
import { useBudgetStore } from './budget.store';
import { useCategoryStore } from './category.store';

export const useDelfiStore = defineStore('delfi', () => {
	const delfi = new Delfi();
	const isInitializing: Ref<boolean> = ref(true);
	const isGeneratingForecast: Ref<boolean> = ref(false);

	// begin with the previous month as hindsight
	const projectionStart = ref<DelfiDate>(date().startOf('month').subtract(1, 'month'));
	const projectionEnd = ref<DelfiDate>(date().startOf('month').add(5, 'year'));

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
	}

	function reCompute() {
		initDelfi().catch((error) => {
			console.error("Error during re-computation:", error);
		});
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
