import { ref } from 'vue'
import { defineStore } from 'pinia'
import request from '@/services/request';
import type { TransactionBudget } from 'delfi-core/models/Transaction';

export const usePlannedTransactionStore = defineStore('plannedTransaction', () => {
	let plannedTransactions = ref<TransactionBudget[]>([]);
	let isLoadingPlannedTransactions = ref(false);
	let isUpsertingPlannedTransaction = ref(false);
	let isDeletingPlannedTransaction = ref(false);

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

	const upsertPlannedTransaction = async (plannedTransactionData: Partial<TransactionBudget>): Promise<TransactionBudget> => {
		let plannedTransactionRes: TransactionBudget;
		try {
			isUpsertingPlannedTransaction.value = true;
			let { data } = plannedTransactionData.budget_id
				? await request.put(`/plannedTransaction/${plannedTransactionData.budget_id}`, plannedTransactionData)
				: await request.post('/plannedTransaction', plannedTransactionData);
			plannedTransactionRes = data.data;
			console.log(data)
			plannedTransactionData.budget_id ?
				plannedTransactions.value = plannedTransactions.value.map(a => a.budget_id === plannedTransactionData.budget_id ? plannedTransactionRes : a)
				: plannedTransactions.value.push(plannedTransactionRes);
		}
		catch (e) {
			console.error(e)
			throw ('Could not upsert plannedTransaction');
		}
		finally {
			isUpsertingPlannedTransaction.value = false;
		} 
		return plannedTransactionRes;
	}

	const deletePlannedTransaction = async (plannedTransactionId: string) => {
		try {
			isDeletingPlannedTransaction.value = true;
			await request.delete(`/plannedTransaction/${plannedTransactionId}`);
			plannedTransactions.value = plannedTransactions.value.filter(a => a.budget_id !== plannedTransactionId)
		}
		catch (e) {
			console.error(e)
			throw ('Could not upsert plannedTransaction');
		}
		finally {
			isDeletingPlannedTransaction.value = false;
		} 
	}

	return {
		plannedTransactions,
		isLoadingPlannedTransactions,
		loadPlannedTransactions,
		upsertPlannedTransaction,
		deletePlannedTransaction
	};
})
