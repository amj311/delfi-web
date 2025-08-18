import { ref } from 'vue'
import { defineStore } from 'pinia'
import request from '@/services/request';
import type { Budget } from 'delfi-core/models/Budget';
import { instantiateDates } from 'delfi-core/utils/dateUtils';

export const useBudgetStore = defineStore('budget', () => {
	let budgets = ref<Budget[]>([]);
	let isLoadingBudgets = ref(false);
	let isUpsertingBudget = ref(false);
	let isDeletingBudget = ref(false);

	async function loadBudgets() {
		try {
			isLoadingBudgets.value = true;
			const { data } = await request.get('/budget');
			instantiateDates(data.data);
			budgets.value = data.data;
		}
		catch (e) {
			console.error("Could not load budgets!")
		}
	}

	const upsertBudget = async (budgetData: Partial<Budget>): Promise<Budget> => {
		let budgetRes: Budget;
		try {
			isUpsertingBudget.value = true;
			let { data } = budgetData.budget_id
				? await request.put(`/budget/${budgetData.budget_id}`, budgetData)
				: await request.post('/budget', budgetData);
			budgetRes = data.data;
			console.log(data)
			budgetData.budget_id ?
				budgets.value = budgets.value.map(a => a.budget_id === budgetData.budget_id ? budgetRes : a)
				: budgets.value.push(budgetRes);
		}
		catch (e) {
			console.error(e)
			throw ('Could not upsert budget');
		}
		finally {
			isUpsertingBudget.value = false;
		} 
		return budgetRes;
	}

	const deleteBudget = async (budgetId: string) => {
		try {
			isDeletingBudget.value = true;
			await request.delete(`/budget/${budgetId}`);
			budgets.value = budgets.value.filter(a => a.budget_id !== budgetId)
		}
		catch (e) {
			console.error(e)
			throw ('Could not upsert budget');
		}
		finally {
			isDeletingBudget.value = false;
		} 
	}

	return {
		budgets,
		isLoadingBudgets,
		loadBudgets: loadBudgets,
		upsertBudget: upsertBudget,
		deleteBudget: deleteBudget,

		getBudgetById: (budgetId?: string | null): Budget | undefined => budgets.value.find(b => b.budget_id === budgetId) || undefined,
	};
})
