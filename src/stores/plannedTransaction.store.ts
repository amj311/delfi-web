import { ref } from 'vue'
import { defineStore } from 'pinia'
import request from '@/services/request';
import type { PlannedTransaction } from 'models/types';

export const usePlannedTransactionStore = defineStore('plannedTransaction', () => {
	let plannedTransactions = ref([] as any[]);
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

	const upsertPlannedTransaction = async (plannedTransactionData: Partial<PlannedTransaction>): Promise<PlannedTransaction> => {
		let plannedTransactionRes: PlannedTransaction;
		try {
			isUpsertingPlannedTransaction.value = true;
			let { data } = plannedTransactionData.planned_transaction_id
				? await request.put(`/plannedTransaction/${plannedTransactionData.planned_transaction_id}`, plannedTransactionData)
				: await request.post('/plannedTransaction', plannedTransactionData);
			plannedTransactionRes = data.data;
			console.log(data)
			plannedTransactionData.planned_transaction_id ?
				plannedTransactions.value = plannedTransactions.value.map(a => a.planned_transaction_id === plannedTransactionData.planned_transaction_id ? plannedTransactionRes : a)
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
			plannedTransactions.value = plannedTransactions.value.filter(a => a.planned_transaction_id !== plannedTransactionId)
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
