import { ref } from 'vue'
import { defineStore } from 'pinia'
import request from '@/services/request';
import type { Account } from 'models/types';

export const useAccountStore = defineStore('account', () => {
	let accounts = ref([] as any[]);
	let isLoadingAccounts = ref(false);
	let isUpsertingAccount = ref(false);

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

	const upsertAccount = async (accountData): Promise<Account> => {
		let accountRes: Account;
		try {
			isUpsertingAccount.value = true;
			let { data } = accountData.account_id
				? await request.put(`/account/${accountData.account_id}`, accountData)
				: await request.post('/account', accountData);
			accountRes = data.data;
			accountData.account_id ?
				accounts.value = accounts.value.map(a => a.account_id === accountData.account_id ? accountRes : a)
				: accounts.value.push(accountRes);
		}
		catch (e) {
			throw ('Could not upsert account');
		}
		finally {
			isUpsertingAccount.value = false;
		}
		return accountRes;
	}

	return {
		accounts,
		isLoadingAccounts,
		loadAccounts,
		getAccountById,
		upsertAccount,
	};
})
