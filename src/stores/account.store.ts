import { ref } from 'vue'
import { defineStore } from 'pinia'
// import { type Account as AccountDef } from "@prisma/client";
// import request from '@/services/request';
import { my_accounts } from './myData';

// interface Account extends AccountDef {}

// class Account extends Any {
//     constructor(def) {
//         Object.assign(this, def);
// 	}

// 	get name () {
// 		return this.custom_name || this.external_name;
// 	}
// }

export const useAccountStore = defineStore('account', () => {
	let accounts = ref([] as any[]);
	let isLoadingAccounts = ref(false);

	async function loadAccounts() {
		try {
			isLoadingAccounts.value = true;
			// const { data } = await request.get('/account');
			// accounts.value = data.data.map(a => new Account(a));
			accounts.value = Object.values(my_accounts);
		}
		catch (e) {
			console.error("Could not load accounts!")
		}

	}

	const getAccountById = (id: string) => {
		return accounts.value.find(a => a.account_id === id);
	}

	return {
		accounts,
		isLoadingAccounts,
		loadAccounts,
		getAccountById,
	};
})
