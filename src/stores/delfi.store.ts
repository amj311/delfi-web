import { reactive } from 'vue'
import { defineStore } from 'pinia'
import { Delfi, type DelfiConfig } from '../../delfi-core';
import type { Account } from 'delfi-core/models/Account';
import type { TransactionSchedule } from 'delfi-core/models/transactions';

export const useDelfiStore = defineStore('delfi', () => {
	let delfi = reactive(new Delfi());
	
	async function initDelfi(config: DelfiConfig) {
		delfi = reactive(new Delfi(config));
	}

	function translateAccounts(accounts: any[]): { [key: string]: Account } {
		return accounts.reduce((map,a) => {
			map[a.account_id] = {
				id: a.account_id,
				type: a.type,
				name: a.custom_name || a.external_name,
				balance: a.current_balance,
			};
			return map;
		}, {});
	}

	function translateTransactionSchedules(schedules: any[]): TransactionSchedule[] {
		return schedules.map(schedule => ({
			...schedule,
			id: schedule.transaction_schedule_id,
		}))
	}

	return { delfi, initDelfi, translateAccounts, translateTransactionSchedules };
})
