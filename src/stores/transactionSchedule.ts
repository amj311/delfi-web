import { ref } from 'vue'
import { defineStore } from 'pinia'
import { type TransactionSchedule as TransactionScheduleDef } from "@prisma/client";
import request from '@/services/request';

interface TransactionSchedule extends TransactionScheduleDef {}

class TransactionSchedule {
    constructor(def: TransactionSchedule) {
        Object.assign(this, def);
    }
}

export const useTransactionScheduleStore = defineStore('transactionSchedule', () => {
	let transactionSchedules = ref([] as TransactionSchedule[]);
	let isLoadingTransactionSchedules = ref(false);

	async function loadTransactionSchedules() {
		try {
			isLoadingTransactionSchedules.value = true;
			const { data } = await request.get('/transactionSchedule');
			transactionSchedules.value = data.data;
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
