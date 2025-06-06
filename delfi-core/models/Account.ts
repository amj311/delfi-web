import { type ScheduledBudget } from "./Transaction"

type SavingsGoal  = {
	savings_goal_id: string,
	account_id?: string,
	account_partition_id?: string,
	target_balance: number,
	target_date?: Date,
	schedule_details?: ScheduledBudget,
}

export type AccountPartition = {
	account_partition_id: string,
	account_id: string,
	name: string,
	current_balance: number,
	savings_goal?: SavingsGoal,
}

export type Account = {
	account_id: string,
	external_account_id?: string,
	display_name: string,
	external_name?: string,
	mask: string,
	type: string,
	subtype: string,
	iso_currency_code: string,
	current_balance: number,
	available_balance: number,
	partitions: AccountPartition[],
	savings_goal?: SavingsGoal,
}
