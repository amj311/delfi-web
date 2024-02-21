import { ref } from 'vue'
import { defineStore } from 'pinia'
import request from '@/services/request';

export const useAccountStore = defineStore('account', () => {
	let accounts = ref([] as any[]);
	let isLoadingAccounts = ref(false);

	async function loadAccounts() {
		try {
			isLoadingAccounts.value = true;
			const { data } = await request.get('/account');
			accounts.value = data.data;
		}
		catch (e) {
			console.error("Could not load accounts!")
		}
		finally {
			isLoadingAccounts.value = false;
		}

	}

	const getAccountById = (id?: string) => {
		return accounts.value.find(a => a.account_id === id);
	}

	return {
		accounts,
		isLoadingAccounts,
		loadAccounts,
		getAccountById,
	};
})
