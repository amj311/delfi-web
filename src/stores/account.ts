import { ref } from 'vue'
import { defineStore } from 'pinia'
import { type Account as AccountDef } from "@prisma/client";
import request from '@/services/request';

interface Account extends AccountDef {}

class Account {
    constructor(def: Account) {
        Object.assign(this, def);
	}

	get name () {
		return this.custom_name || this.external_name;
	}
}

export const useAccountStore = defineStore('account', () => {
	let accounts = ref([] as Account[]);
	let isLoadingAccounts = ref(false);

	async function loadAccounts() {
		try {
			isLoadingAccounts.value = true;
			const { data } = await request.get('/account');
			accounts.value = data.data.map(a => new Account(a));
		}
		catch (e) {
			console.error("Could not load accounts!")
		}

	}

	return {
		accounts,
		isLoadingAccounts,
		loadAccounts,
	};
})
