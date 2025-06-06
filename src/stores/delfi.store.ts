import { reactive } from 'vue'
import { defineStore } from 'pinia'
import { Delfi, type DelfiConfig } from '../../delfi-core';
import type { Account, Account as DelfiAccount } from 'delfi-core/models/Account';
import type { TransactionBudget as DelfiPlannedTransaction, TransactionBudget } from 'delfi-core/models/Transaction';
import type { ParentCategory } from 'delfi-core/models/Category';

type DelfiConfigRaw = {
	accounts: Account[],
	planned_transactions: TransactionBudget[],
	categories: ParentCategory[],
};

export const useDelfiStore = defineStore('delfi', {
	state: () => ({
		delfi: <Delfi><unknown>null,
	}),

	actions: {
		async initDelfi(config: DelfiConfigRaw) {
			this.delfi = reactive(new Delfi({
				accounts: this.translateAccounts(config.accounts),
				plannedTransactions: this.translatePlannedTransactions(config.planned_transactions),
				categories: config.categories,
			}));
		},
	
		translateAccounts(accounts: Account[]): DelfiAccount[] {
			return accounts.map((a) => ({
				...a,
				current_balance: a.current_balance || 0,
				partitions: a.partitions?.map(p => ({
					...p,
					// target_balance: p.target_balance || 0,
					// schedule_details: p.schedule_details as any,
					// target_date: date(p.target_date).toISOString(),
				})) || [],
			})) as any[];
		},
	
		translatePlannedTransactions(schedules: TransactionBudget[]): DelfiPlannedTransaction[] {
			return schedules.map(schedule => ({
				...schedule,
				id: schedule.budget_id,
			}))
		}
	}
})
