import { ref } from 'vue'
import { defineStore } from 'pinia'
import { type TransactionSchedule as TransactionScheduleDef } from "@prisma/client";
import request from '@/services/request';
import { my_scheduledTransactions } from './myData';

// interface TransactionSchedule extends TransactionScheduleDef {}

// class TransactionSchedule {
//     constructor(def: TransactionSchedule) {
//         Object.assign(this, def);
//     }
// }

export const useTransactionScheduleStore = defineStore('transactionSchedule', () => {
	let transactionSchedules = ref([] as any[]);
	let isLoadingTransactionSchedules = ref(false);

	async function loadTransactionSchedules() {
		try {
			isLoadingTransactionSchedules.value = true;
			// const { data } = await request.get('/transactionSchedule');
			// transactionSchedules.value = data.data;
			transactionSchedules.value = my_scheduledTransactions;
		}
		catch (e) {
			console.error("Could not load transactionSchedules!")
		}

	}

	return {
		transactionSchedules,
		isLoadingTransactionSchedules,
		loadTransactionSchedules,
	};
})
