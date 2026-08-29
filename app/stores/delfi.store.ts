import { computed, reactive, ref, type Reactive, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { Delfi, type DelfiConfig } from '../../delfi-core/Delfi';
import { ddate, type DelfiDate } from 'delfi-core/utils/dateUtils';
import { TransactionService } from '@/services/transaction.service';
import { useAccountStore } from './account.store';
import { useBudgetStore } from './budget.store';
import { useCategoryStore } from './category.store';
import type { Transaction } from 'delfi-core/models/Transaction';

export const useDelfiStore = defineStore('delfi', () => {
	const delfi = new Delfi();
	const isInitializing: Ref<boolean> = ref(true);
	const isGeneratingForecast: Ref<boolean> = ref(false);
	const extendingProjection = ref(false);

	const computeTimeout = ref<number | null>(null);

	// begin with a few previous months as hindsight
	const projectionStart = ref<DelfiDate>(ddate().startOf('month').subtract(3, 'month'));
	const projectionEnd = ref<DelfiDate>(ddate().startOf('month').add(5, 'year'));

	const reComputed = ref(0);
	function updateRecomputed() {
		reComputed.value += 1;
	}

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
		updateRecomputed();
		isGeneratingForecast.value = true;
		await delfi.computeForecast();
		isGeneratingForecast.value = false;

		scheduleCompute(); // schedule another compute to keep data fresh
	}

	async function reCompute() {
		// load new accounts as well, to update the sync statuses
		await useAccountStore().loadAccounts();
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
		}, 60 * 60 * 1000); // every hour. Backend sync once an hour so this is the highest reasonable frequency
	}

	/**
	 * Handles getting the summary out of Delfi or computing additional dates if needed.
	 */
	async function getMonthSummary(monthStart: DelfiDate) {
		if (monthStart.isBefore(projectionStart.value) || monthStart.isAfter(projectionEnd.value)) {
			// If the month is out of the projected range, we need to compute it
			await extendProjection(monthStart);
		}
		return delfi.getMonthSummary(monthStart);
	}

	/**
	 * Adds additional dates to the projection period and computes the additional timeframe in Delfi.
	 */
	async function extendProjection(newDate: DelfiDate) {
		if (extendingProjection.value) {
			return; // already extending
		}
		extendingProjection.value = true;
		try {
			await delfi.extendForecast(newDate);
			projectionStart.value = delfi.start;
			projectionEnd.value = delfi.end;
		}
		catch (error) {
			console.error("Error extending projection:", error);
		}
		finally {
			extendingProjection.value = false;
		}
	}

	return {
		delfi,
		initDelfi,
		isInitializing,
		isGeneratingForecast,
		projectionStart,
		projectionEnd,
		async updateTransactions(tx: Array<Transaction>) {
			await delfi.updateTransactions(tx);
			updateRecomputed();
		},
		reCompute,
		reComputed,
		getMonthSummary,
	}
})
