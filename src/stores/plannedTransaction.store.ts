import { ref } from 'vue'
import { defineStore } from 'pinia'
import request from '@/services/request';

export const usePlannedTransactionStore = defineStore('plannedTransaction', () => {
	let plannedTransactions = ref([] as any[]);
	let isLoadingPlannedTransactions = ref(false);

	async function loadPlannedTransactions() {
		try {
			isLoadingPlannedTransactions.value = true;
			const { data } = await request.get('/plannedTransaction');
			plannedTransactions.value = data.data;
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
