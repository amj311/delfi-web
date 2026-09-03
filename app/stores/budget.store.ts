import { computed, ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import request from '@/services/request';
import type { Budget } from 'delfi-core/models/Budget';
import { instantiateDates, type DelfiDate } from 'delfi-core/utils/dateUtils';
import { useCategoryStore } from './category.store';
import { useDelfiStore } from './delfi.store';
import { ddate } from 'delfi-core/utils/dateUtils';
import { BudgetDisplayShapes, RecurrenceType, type BudgetDisplayShape } from 'delfi-core/models/Budget';
import type { AttributionEvent } from 'delfi-core/models/Transaction';

export const useBudgetStore = defineStore('budget', () => {
	let budgets = ref<Budget[]>([]);
	let isLoadingBudgets = ref(false);
	let isUpsertingBudget = ref(false);
	let isDeletingBudget = ref(false);

	// Drawer state for BudgetActions component
	const upsertingBudget = ref<Budget | null>(null);

	const orderedBudgets = computed(() => {
		const orderedCategories = useCategoryStore().orderedCategories;
		const output = [] as Budget[];
		for (const category of orderedCategories) {
			output.push(
				...(budgets.value
					.filter((b) => b.category_id === category.category_id)
					.sort((a, b) => a.memo.localeCompare(b.memo)) || [])
			);
		}
		return output;
	});

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

	const postUpsertBudgetRes = ref((budget?: Budget) => {});

	const upsertBudget = async (budgetData: Partial<Budget>): Promise<Budget> => {
		let budgetRes: Budget | undefined = undefined;
		try {
			isUpsertingBudget.value = true;
			let { data } = budgetData.budget_id
				? await request.put(`/budget/${budgetData.budget_id}`, budgetData)
				: await request.post('/budget', budgetData);
			budgetRes = data.data;
			console.log(data)
			budgetData.budget_id ?
				budgets.value = budgets.value.map(a => a.budget_id === budgetData.budget_id ? budgetRes! : a)
				: budgets.value.push(budgetRes!);
			useDelfiStore().reCompute();
			return budgetRes!;
		}
		catch (e) {
			console.error(e)
			throw ('Could not upsert budget');
		}
		finally {
			isUpsertingBudget.value = false;
			postUpsertBudgetRes.value(budgetRes);
		} 
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

	const openUpsertBudget = (budget: Budget) => {
		upsertingBudget.value = budget;
	}

	const closeUpsertBudget = () => {
		upsertingBudget.value = null;
	}

	const createNewBudget = async (config: {
		displayShape?: BudgetDisplayShape,
		fromEvent?: AttributionEvent,
		start?: DelfiDate,
	} = {}) => {
		const monthStart = (config.start || config.fromEvent?.date || ddate()).startOf('month');
		const displayShape = config.displayShape || (
			config.fromEvent?.attributionDetails?.sourceTransaction?.TransferPair
				? 'SAVINGS'
				: (config.fromEvent?.Category?.type
					|| ((config.fromEvent && config.fromEvent?.amount > 0)
						? 'INCOME' : 'EXPENSE'))
		);
		const defaultAmount = BudgetDisplayShapes[displayShape].amountSign * 50;
		const newBudget: Budget = {
			budget_id: '', // Will be assigned by the server
			memo: config.fromEvent?.attributionDetails?.memo
				|| config.fromEvent?.attributionDetails?.softDescription || 'New ' + displayShape.toLowerCase(),
			category_id: config.fromEvent?.category_id || null,
			account_id: config.fromEvent?.account_id || '',
			origin_account_id: config.fromEvent?.attributionDetails.sourceTransaction.TransferPair?.account_id || undefined,
			displayShape,
			recurrence_type: RecurrenceType.SCHEDULE,
			scheduleVariants: [
				{
					schedule_variant_id: '', // Will be assigned by the server
					schedule: {
						start: monthStart,
						end: undefined,
						frequency: 'MONTHLY',
						interval: 1,
					},
					amountTemplate: {
						type: 'fixed',
						amount: config.fromEvent?.amount || defaultAmount,
					},
				},
			],
		};

		return new Promise<Budget | undefined>((res) => {
			postUpsertBudgetRes.value = res;
			openUpsertBudget(newBudget);
		})
	}

	return {
		budgets,
		orderedBudgets,
		isLoadingBudgets,
		loadBudgets: loadBudgets,
		upsertBudget: upsertBudget,
		deleteBudget: deleteBudget,
		upsertingBudget,
		openUpsertBudget,
		closeUpsertBudget,
		createNewBudget,
		postUpsertBudgetRes,

		getBudgetById: (budgetId?: string | null): Budget | undefined => budgets.value.find(b => b.budget_id === budgetId) || undefined,
	};
})
