import { type ScheduledBudget } from "./Budget"

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

export type AccountDetails = {
	external_name: string,
	external_account_id: string,
	scraper_navigation_id?: string,
	mask: string,
	type: string,
	subtype: string,
	apy?: number | null,
	iso_currency_code: string,
	current_balance: number,
	available_balance: number,
}

export type Account = AccountDetails & {
	account_id: string,
	display_name: string,
	partitions: AccountPartition[],
	savings_goal?: SavingsGoal,
}
