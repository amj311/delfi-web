import { type ScheduledBudget } from "./Budget"

export type Institution = {
	institution_id: string,
	name: string,
	logo: string | null,
	plaid_institution_id: string | null,
}

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

export enum AccountType {
	depository = 'depository',
	credit = 'credit',
	investment = 'investment',
	loan = 'loan',
	other = 'other',
}

export enum AccountSubtype {
	checking = 'checking',
	savings = 'savings',
	credit_card = 'credit_card',
	line_of_credit = 'line_of_credit',
	cd = 'cd',
	ira = 'ira',
	stock = 'stock',
	mortgage = 'mortgage',
	personal_loan = 'personal_loan',
	auto_loan = 'auto_loan',
	other = 'other',
}

export const AccountTypes = {
	depository: {
		type: AccountType.depository,
		subtypes: [AccountSubtype.checking, AccountSubtype.savings] as const,
	},
	credit: {
		type: AccountType.credit,
		subtypes: [AccountSubtype.credit_card, AccountSubtype.line_of_credit] as const,
	},
	investment: {
		type: AccountType.investment,
		subtypes: [AccountSubtype.cd, AccountSubtype.ira, AccountSubtype.stock] as const,
	},
	loan: {
		type: AccountType.loan,
		subtypes: [AccountSubtype.mortgage, AccountSubtype.personal_loan, AccountSubtype.auto_loan] as const,
	},
	other: {
		type: AccountType.other,
		subtypes: [AccountSubtype.other] as const,
	},
}


export type AccountDetails = {
	institution_id: string,
	external_name: string,
	external_account_id: string,
	type: keyof typeof AccountTypes,
	subtype: (typeof AccountTypes[keyof typeof AccountTypes]['subtypes'])[number],
	mask: string,
	apy?: number | null,
	iso_currency_code: string,
	current_balance: number,
	available_balance?: number,
	limit?: number | null,

	source: string, // e.g. "plaid", "manual", "imported"
	source_id?: string | null, // e.g. plaid account id, manual account id, imported account id
	source_data?: any, // e.g. plaid account data, imported account data
	plaid_item_id?: string | null, // If the account is linked to a Plaid item, the Plaid item ID
	plaid_account_id?: string | null, // If the account is linked to Plaid, Plaid's ID for the account
}

export type Account = AccountDetails & {
	account_id: string,
	display_name?: string | null,
	partitions: AccountPartition[],
	savings_goal?: SavingsGoal,
	workspace_id: string,
	last_successful_sync?: Date | null,
	last_failed_sync?: Date | null,
	sync_error?: string | null,
	created_at: Date,
	Institution: Institution,
}
