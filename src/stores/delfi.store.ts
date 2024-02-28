import { reactive } from 'vue'
import { defineStore } from 'pinia'
import { Delfi, type DelfiConfig } from '../../delfi-core';
import type { Account as DelfiAccount } from 'delfi-core/models/Account';
import type { PlannedTransaction as DelfiPlannedTransaction } from 'delfi-core/models/Transaction';
import type { Account, Budget, PlannedTransaction, UserCategory } from 'models/types';
import { date } from '../../delfi-core/utils/dateUtils';

type DelfiConfigRaw = {
	accounts: Account[],
	planned_transactions: PlannedTransaction[],
	budgets: Budget[],
	user_categories: UserCategory[],
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
				budgets: config.budgets,
				userCategories: config.user_categories,
			}));
		},
	
		translateAccounts(accounts: Account[]): DelfiAccount[] {
			return accounts.map((a) => ({
				...a,
				current_balance: a.current_balance || 0,
				partitions: a.partitions?.map(p => ({
					...p,
					target_balance: p.target_balance || 0,
					schedule_details: p.schedule_details as any,
					target_date: date(p.target_date).toISOString(),
				})) || [],
			}));
		},
	
		translatePlannedTransactions(schedules: PlannedTransaction[]): DelfiPlannedTransaction[] {
			console.log(schedules)
			return schedules.map(schedule => ({
				...schedule,
				id: schedule.planned_transaction_id,
			}))
		}
	}
})
