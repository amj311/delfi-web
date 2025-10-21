import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import request from '@/services/request';
import type { Account, Account as DelfiAccount } from '../../delfi-core/models/Account';
import { useDelfiStore } from './delfi.store';
import { ddate } from '../../delfi-core/utils/dateUtils';

export const useAccountStore = defineStore('account', () => {
	const delfiStore = useDelfiStore();

	let accounts = ref([] as Account[]);
	let isLoadingAccounts = ref(false);
	let isUpsertingAccount = ref(false);
	let isDeletingAccount = ref(false);

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

	function getAccountById (id?: string | null) {
		return accounts.value.find(a => a.account_id === id);
	}

	function getAccountName(id?: string | null): string {
		const account = getAccountById(id);
		return account?.display_name || account?.external_name || 'Unknown Account';
	}

	async function syncAccounts() {
		try {
			const { data } = await request.post('/account/sync');
			accounts.value = data.data;
		}
		catch (e) {
			console.error("Could not sync accounts!")
		}
	}

	async function syncAccount(accountId: string) {
		try {
			await request.post(`/account/${accountId}/sync`);
		}
		catch (e) {
			console.error("Could not sync account!")
		}
	}

	const upsertAccount = async (accountData: Partial<Account>): Promise<Account> => {
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
			console.error(e)
			throw ('Could not upsert account');
		}
		finally {
			isUpsertingAccount.value = false;
		} 
		return accountRes;
	}

	const deleteAccount = async (accountId: string) => {
		try {
			isDeletingAccount.value = true;
			await request.delete(`/account/${accountId}`);
			accounts.value = accounts.value.filter(a => a.account_id !== accountId)
		}
		catch (e) {
			console.error(e)
			throw ('Could not upsert account');
		}
		finally {
			isDeletingAccount.value = false;
		} 
	}

	const accountsByInstitution = computed(() => {
		const institutions = new Map();
		
		accounts.value.forEach(account => {
			const institutionName = account.Institution?.name || 'Unknown Institution';
			if (!institutions.has(institutionName)) {
				institutions.set(institutionName, {
					name: institutionName,
					institution: account.Institution,
					accounts: []
				});
			}
			institutions.get(institutionName).accounts.push(account);
		});
		
		return Array.from(institutions.values()).sort((a, b) => a.name.localeCompare(b.name));
	});

	return {
		accounts,
		isLoadingAccounts,
		loadAccounts,
		syncAccounts,
		syncAccount,
		getAccountById,
		getAccountName,
		upsertAccount,
		deleteAccount,
		accountsByInstitution
	};
})
