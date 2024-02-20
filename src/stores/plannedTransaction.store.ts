import { ref } from 'vue'
import { defineStore } from 'pinia'
import request from '@/services/request';
import { my_scheduledTransactions } from './myData';

// interface PlannedTransaction extends PlannedTransactionDef {}

// class PlannedTransaction {
//     constructor(def: PlannedTransaction) {
//         Object.assign(this, def);
//     }
// }

export const usePlannedTransactionStore = defineStore('plannedTransaction', () => {
	let plannedTransactions = ref([] as any[]);
	let isLoadingPlannedTransactions = ref(false);

	async function loadPlannedTransactions() {
		try {
			isLoadingPlannedTransactions.value = true;
			const { data } = await request.get('/plannedTransaction');
			plannedTransactions.value = data.data;
			// plannedTransactions.value = my_scheduledTransactions;
		}
		catch (e) {
			console.error("Could not load plannedTransactions!")
		}

	}

	return {
		plannedTransactions,
		isLoadingPlannedTransactions,
		loadPlannedTransactions,
	};
})
