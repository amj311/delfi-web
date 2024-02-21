import { ref } from 'vue'
import { defineStore } from 'pinia'
import request from '@/services/request';
import { my_scheduledTransactions } from './myData';

// interface Budget extends BudgetDef {}

// class Budget {
//     constructor(def: Budget) {
//         Object.assign(this, def);
//     }
// }

export const useBudgetStore = defineStore('budget', () => {
	let budgets = ref([] as any[]);
	let isLoadingBudgets = ref(false);

	async function loadBudgets() {
		try {
			isLoadingBudgets.value = true;
			const { data } = await request.get('/budget');
			budgets.value = data.data;
			// budgets.value = my_scheduledTransactions;
		}
		catch (e) {
			console.error("Could not load budgets!")
		}

	}

	return {
		budgets,
		isLoadingBudgets,
		loadBudgets,
	};
})
