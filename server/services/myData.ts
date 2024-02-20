import { MONTHS } from "../../delfi-core/utils/constants";
import { v4 as uuid } from "uuid";
import { ImmediateMatchTrigger, type Trigger } from "../../delfi-core/models/schedules/triggers";
import { flatCategoriesMap } from "../../delfi-core/models/systemCategories";
import type { Schedule } from "../../delfi-core/models/schedules/Schedule";
import { PlannedTransactionType, RecurrenceType } from "../../delfi-core/models/Transaction";
import { Account, Budget, PlannedTransaction, UserCategory } from "../../models/types";

const accountStuff = {
	mask: "**** **** **** 0942",
	iso_currency_code: "USD",
	plaid_item_id: "afcu_checking",
	user_id: "myself",
	external_account_id: uuid(),
	external_name: "asdfgtrf",
	type: "depository",
	subtype: "checking",
}

export const my_accounts: { [key: string]: Account } = {
	afcu_checking: {
		account_id: uuid(),
		custom_name: "AFCU Checking",
		current_balance: 200,
		available_balance: 200,
		partitions: [],
		...accountStuff,
	},
	afcu_savings: {
		account_id: uuid(),
		custom_name: "AFCU Savings",
		current_balance: 5100,
		available_balance: 5100,
		partitions: [],
		...accountStuff,
	},
	us_savings: {
		account_id: uuid(),
		custom_name: "US Bank",
		current_balance: 3000,
		available_balance: 3000,
		partitions: [],
		...accountStuff,
	},
};

my_accounts.afcu_savings.partitions = [
	{
		account_partition_id: 'test-partition-id',
		account_id: my_accounts.afcu_savings.account_id,
		name: 'New Car',
		current_balance: 5100,
		// target_balance: 7000,
		// target_date: new Date(2024, MONTHS.SEP, 1),
		// schedule_details: {
		// 	planned_transaction_id: uuid(),
		// 	amount: 1800,
		// 	memo: "New Car Savings",
		// 	type: PlannedTransactionType.TRANSFER,
		// 	origin_account_id: my_accounts.afcu_checking.account_id,
		// 	target_account_id: my_accounts.afcu_savings.account_id,
		// 	user_id: 'myself',
		// 	target_account_partition_id: 'test-partition-id',
		// 	schedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 25)),
		// 	category_id: flatCategoriesMap["Transfer"].category_id,
		// },
	}
];

export const customCategories: UserCategory[] = [
	{
		name: "Tithing",
		category_id: uuid(),
		parent_category_id: flatCategoriesMap["Gifts & Donations"].category_id,
		user_id: 'me',
	},
	{
		name: "Fast Offering",
		category_id: uuid(),
		parent_category_id: flatCategoriesMap["Gifts & Donations"].category_id,
		user_id: 'me',
	},
];

export const customCategoriesMap = Object.fromEntries(customCategories.flatMap(category => ([
	[category.name, category],
])));

const defaultTransaction: PlannedTransaction = {
	user_id: 'myself',
	planned_transaction_id: 'replaceMee',
	type: PlannedTransactionType.DEBIT,
	memo: "",
	amount: 0,
	target_account_id: '',
	origin_account_id: null,
	target_account_partition_id: null,
	origin_account_partition_id: null,
	recurrence_type: RecurrenceType.SCHEDULE,
	schedule: { rrules: [] },
	trigger: null,
	category_id: flatCategoriesMap["Life Insurance"].category_id,
}
export const my_scheduledTransactions: PlannedTransaction[] = [
	/**
	 * EVERY MONTH
	 */
	{ 
		...defaultTransaction,
		planned_transaction_id: uuid(),
		type: PlannedTransactionType.DEBIT,
		memo: "Arthur Life Insurance",
		amount: 300,
		target_account_id: my_accounts.afcu_checking.account_id,
		recurrence_type: RecurrenceType.SCHEDULE,
		schedule: { rrules: [ { start: '2021-04-05', frequency: 'MONTHLY', byDayOfMonth: [5] } ] },
		category_id: flatCategoriesMap["Life Insurance"].category_id,
	},
	{ 
		...defaultTransaction,
		planned_transaction_id: uuid(),
		type: PlannedTransactionType.DEBIT,
		memo: "Rachel Life Insurance",
		amount: 70,
		target_account_id: my_accounts.afcu_checking.account_id,
		recurrence_type: RecurrenceType.SCHEDULE,
		schedule: { rrules: [ { start: '2021-04-05', frequency: 'MONTHLY', byDayOfMonth: [5] } ] },
		category_id: flatCategoriesMap["Life Insurance"].category_id
	},
	{ // Car Insurance
		...defaultTransaction,
		planned_transaction_id: uuid(),
		type: PlannedTransactionType.DEBIT,
		memo: "Car Insurance",
		amount: 81,
		target_account_id: my_accounts.afcu_checking.account_id,
		recurrence_type: RecurrenceType.SCHEDULE,
		schedule: { rrules: [ { start: '2021-04-08', frequency: 'MONTHLY', byDayOfMonth: [8] } ] },
		category_id: flatCategoriesMap["Auto Insurance"].category_id
	},

	{ // Clozd fulltime
		...defaultTransaction,
		planned_transaction_id: uuid(),
		type: PlannedTransactionType.CREDIT,
		memo: "Clozd Salary",
		amount: 3140,
		target_account_id:  my_accounts.afcu_checking.account_id,
		recurrence_type: RecurrenceType.SCHEDULE,
		schedule: { rrules: [ { start: '2021-04-08', frequency: 'MONTHLY', byDayOfMonth: [14, 29] } ] },
		category_id: flatCategoriesMap["Paycheck"].category_id
	},
	{
		...defaultTransaction,
		planned_transaction_id: uuid(),
		type: PlannedTransactionType.DEBIT,
		memo: "Tithing",
		target_account_id: my_accounts.afcu_checking.account_id,
		category_id: customCategoriesMap["Tithing"].category_id,
		recurrence_type: RecurrenceType.TRIGGER,
		trigger: new ImmediateMatchTrigger({
			filter: [{
				property: 'type',
				operator: 'eq',
				operand: PlannedTransactionType.CREDIT,
			}],
			computation: {
				operator: 'percent',
				operand: 10
			}
		}),
	},
	{
		...defaultTransaction,
		planned_transaction_id: uuid(),
		type: PlannedTransactionType.DEBIT,
		memo: "Fast Offering",
		amount: 100,
		target_account_id: my_accounts.afcu_checking.account_id,
		category_id: customCategoriesMap["Fast Offering"].category_id,
		recurrence_type: RecurrenceType.SCHEDULE,
		schedule: { rrules: [ { start: '2022-05-07', frequency: 'MONTHLY', byDayOfMonth: [7] } ] }
	},

	{
		...defaultTransaction,
		planned_transaction_id: uuid(),
		type: PlannedTransactionType.DEBIT,
		memo: "Mortgage",
		amount: 2445,
		target_account_id: my_accounts.afcu_checking.account_id,
		category_id: flatCategoriesMap["Mortgage & Rent"].category_id,
		recurrence_type: RecurrenceType.SCHEDULE,
		schedule: { rrules: [ { start: '2022-06-17', frequency: 'MONTHLY', byDayOfMonth: [17] } ] }
	},
	{
		...defaultTransaction,
		planned_transaction_id: uuid(),
		type: PlannedTransactionType.DEBIT,
		memo: "HOA",
		amount: 215,
		target_account_id: my_accounts.afcu_checking.account_id,
		category_id: flatCategoriesMap["Home Services"].category_id,
		recurrence_type: RecurrenceType.SCHEDULE,
		schedule: { rrules: [ { start: '2022-06-18', frequency: 'MONTHLY', byDayOfMonth: [18] } ] }
	},
	{
		...defaultTransaction,
		planned_transaction_id: uuid(),
		type: PlannedTransactionType.DEBIT,
		memo: "Gas Bill",
		amount: 50,
		target_account_id: my_accounts.afcu_checking.account_id,
		category_id: flatCategoriesMap["Utilities"].category_id,
		recurrence_type: RecurrenceType.SCHEDULE,
		schedule: { rrules: [ { start: '2022-06-18', frequency: 'MONTHLY', byDayOfMonth: [18] } ] }
	},
	{
		...defaultTransaction,
		planned_transaction_id: uuid(),
		type: PlannedTransactionType.DEBIT,
		memo: "Power Bill",
		amount: 30,
		target_account_id: my_accounts.afcu_checking.account_id,
		category_id: flatCategoriesMap["Utilities"].category_id,
		recurrence_type: RecurrenceType.SCHEDULE,
		schedule: { rrules: [ { start: '2022-06-17', frequency: 'MONTHLY', byDayOfMonth: [17] } ] }
	},
	{
		...defaultTransaction,
		planned_transaction_id: uuid(),
		type: PlannedTransactionType.DEBIT,
		memo: "Internet",
		amount: 50,
		target_account_id: my_accounts.afcu_checking.account_id,
		category_id: flatCategoriesMap["Utilities"].category_id,
		recurrence_type: RecurrenceType.SCHEDULE,
		schedule: { rrules: [ { start: '2022-06-17', frequency: 'MONTHLY', byDayOfMonth: [17] } ] }
	},

	{
		...defaultTransaction,
		planned_transaction_id: uuid(),
		type: PlannedTransactionType.DEBIT,
		memo: "Preschool",
		amount: 170,
		target_account_id: my_accounts.afcu_checking.account_id,
		category_id: flatCategoriesMap["Tuition"].category_id,
		recurrence_type: RecurrenceType.SCHEDULE,
		schedule: { rrules: [ { start: '2024-09-01', frequency: 'MONTHLY', byDayOfMonth: [1] } ] }
	},


	/**
	 * SAVINGS
	 */
	{
		...defaultTransaction,
		planned_transaction_id: uuid(),
		type: PlannedTransactionType.TRANSFER,
		memo: "Emergency Savings Transfer",
		amount: 300,
		target_account_id: my_accounts.afcu_savings.account_id,
		origin_account_id: my_accounts.afcu_checking.account_id,
		recurrence_type: RecurrenceType.SCHEDULE,
		schedule: { rrules: [ { start: '2022-09-01', frequency: 'MONTHLY', byDayOfMonth: [1] } ] },
		category_id: flatCategoriesMap["Transfer"].category_id,
	},
];



const sharedBudgetThings = {
	user_id: 'myself',
	description: null,
}

export const budgets: Budget[] = [
	{
		...sharedBudgetThings,
		budget_id: uuid(),
		name: 'Groceries',
		amount: 300,
		schedule: { rrules: [ { start: '2022-09-01', frequency: 'MONTHLY', byDayOfMonth: [1] } ] },
		num_months: 1,
		category_id: flatCategoriesMap.Groceries.category_id,
		system_event_account_id: my_accounts.afcu_checking.account_id,
	},
	{
		...sharedBudgetThings,
		budget_id: uuid(),
		name: "Fuel",
		amount: 50,
		category_id: flatCategoriesMap.Fuel.category_id,
		system_event_account_id: my_accounts.afcu_checking.account_id,
		schedule: { rrules: [ { start: '2021-04-01', frequency: 'MONTHLY', byDayOfMonth: [1] } ] },
		num_months: 1,
	},
	// Fun Money
	{
		...sharedBudgetThings,
		budget_id: uuid(),
		name: "Fun Money",
		category_id: flatCategoriesMap.Shopping.category_id,
		schedule: { rrules: [ { start: '2021-04-01', frequency: 'MONTHLY', byDayOfMonth: [1] } ] },
		amount: 150,
		system_event_account_id: my_accounts.afcu_checking.account_id,
		num_months: 1,
	},
	// Baby Care
	{
		...sharedBudgetThings,
		budget_id: uuid(),
		name: "Baby Care",
		category_id: flatCategoriesMap.Shopping.category_id,
		schedule: { rrules: [ { start: '2021-04-01', frequency: 'MONTHLY', byDayOfMonth: [1] } ] },
		amount: 50,
		system_event_account_id: my_accounts.afcu_checking.account_id,
		num_months: 1,
	},
];
