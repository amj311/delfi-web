import { XPerMonthSchedule } from "../../delfi-core/models/schedules/XPerMonthSchedule";
import { type PlannedTransaction, PlannedTransactionType } from "../../delfi-core/models/Transaction";
import { MONTHS } from "../../delfi-core/utils/constants";
import { v4 as uuid } from "uuid";
import { ImmediateMatchTrigger } from "../../delfi-core/models/schedules/triggers";
import type { Budget } from "delfi-core/models/Budget";
import { flatCategoriesMap } from "../../delfi-core/models/systemCategories";
import type { UserCategory } from "delfi-core/models/Category";

const requiredStuff = {
	mask: "**** **** **** 0942",
	iso_currency_code: "USD",
	plaid_item_id: "afcu_checking",
	user_id: "myself",
}

export const my_accounts = {
	afcu_checking: {
		account_id: uuid(),
		external_account_id: uuid(),
		external_name: "asdfgtrf",
		custom_name: "AFCU Checking",
		type: "depository",
		subtype: "checking",
		current_balance: 200,
		partitions: <unknown[]>[],
	},
	afcu_savings: {
		account_id: uuid(),
		external_name: "asdfgtrf",
		custom_name: "AFCU Savings",
		current_balance: 5100,
		partitions: <unknown[]>[],
	},
	us_savings: {
		account_id: uuid(),
		external_name: "asdfgtrf",
		custom_name: "US Bank",
		current_balance: 3000,
		partitions: <unknown[]>[],
	},
};

my_accounts.afcu_savings.partitions = [
	{
		partition_id: 'test-partition-id',
		name: 'New Car',
		balance: 5100,
		target: 7000,
		target_date: new Date(2024, MONTHS.SEP, 1),
		transferSchedule: {
			id: uuid(),
			amount: 500,
			memo: "New Car Savings",
			type: PlannedTransactionType.transfer,
			originAccount: my_accounts.afcu_checking.account_id,
			targetAccount: my_accounts.afcu_savings.account_id,
			targetPartition: 'test-partition-id',
			schedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 25)),
			categoryId: flatCategoriesMap["Transfer"].category_id,
		}
	}
];



export const customCategories: UserCategory[] = [
	{
		"name": "Tithing",
		category_id: uuid(),
		parent_id: flatCategoriesMap["Gifts & Donations"].category_id,
		user_id: 'me',
	},
	{
		"name": "Fast Offering",
		category_id: uuid(),
		parent_id: flatCategoriesMap["Gifts & Donations"].category_id,
		user_id: 'me',
	},
];

export const customCategoriesMap = Object.fromEntries(customCategories.flatMap(category => ([
	[category.name, category],
])));



export const my_scheduledTransactions: any[] = [
	/**
	 * EVERY MONTH
	 */
	{ 
		transaction_schedule_id: uuid(),
		type: PlannedTransactionType.expense,
		memo: "Arthur Life Insurance",
		amount: 300,
		targetAccount: my_accounts.afcu_checking.account_id,
		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 5)),
		categoryId: flatCategoriesMap["Life Insurance"].category_id
	},
	{ 
		transaction_schedule_id: uuid(),
		type: PlannedTransactionType.expense,
		memo: "Rachel Life Insurance",
		amount: 70,
		targetAccount: my_accounts.afcu_checking.account_id,
		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 5)),
		categoryId: flatCategoriesMap["Life Insurance"].category_id
	},
	{ // Car Insurance
		transaction_schedule_id: uuid(),
		type: PlannedTransactionType.expense,
		memo: "Car Insurance",
		amount: 81,
		targetAccount: my_accounts.afcu_checking.account_id,
		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 8)),
		categoryId: flatCategoriesMap["Auto Insurance"].category_id
	},

	{ // Clozd fulltime
		transaction_schedule_id: uuid(),
		type: PlannedTransactionType.income,
		memo: "Clozd Salary",
		amount: 3140,
		targetAccount:  my_accounts.afcu_checking.account_id,

		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(2, new Date(2022, MONTHS.MAY, 14)),
		categoryId: flatCategoriesMap["Paycheck"].category_id
	},
	{
		transaction_schedule_id: uuid(),
		type: PlannedTransactionType.expense,
		memo: "Tithing",
		targetAccount: my_accounts.afcu_checking.account_id,
		categoryId: customCategoriesMap["Tithing"].category_id,
		recurrenceType: 'trigger',
		trigger: new ImmediateMatchTrigger({
			filter: [{
				property: 'type',
				operator: 'eq',
				operand: PlannedTransactionType.income,
			}],
			computation: {
				operator: 'percent',
				operand: 10
			}
		}),
	},
	{
		transaction_schedule_id: uuid(),
		type: PlannedTransactionType.expense,
		memo: "Fast Offering",
		amount: 100,
		targetAccount: my_accounts.afcu_checking.account_id,
		categoryId: customCategoriesMap["Fast Offering"].category_id,
		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.MAY, 7))
	},

	{
		transaction_schedule_id: uuid(),
		type: PlannedTransactionType.expense,
		memo: "Mortgage",
		amount: 2445,
		targetAccount: my_accounts.afcu_checking.account_id,
		categoryId: flatCategoriesMap["Mortgage & Rent"].category_id,
		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.JUN, 17))
	},
	{
		transaction_schedule_id: uuid(),
		type: PlannedTransactionType.expense,
		memo: "HOA",
		amount: 215,
		targetAccount: my_accounts.afcu_checking.account_id,
		categoryId: flatCategoriesMap["Home Services"].category_id,
		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.JUN, 18))
	},
	{
		transaction_schedule_id: uuid(),
		type: PlannedTransactionType.expense,
		memo: "Gas Bill",
		amount: 50,
		targetAccount: my_accounts.afcu_checking.account_id,
		categoryId: flatCategoriesMap["Utilities"].category_id,
		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.JUN, 18))
	},
	{
		transaction_schedule_id: uuid(),
		type: PlannedTransactionType.expense,
		memo: "Power Bill",
		amount: 30,
		targetAccount: my_accounts.afcu_checking.account_id,
		categoryId: flatCategoriesMap["Utilities"].category_id,
		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.JUN, 17))
	},
	{
		transaction_schedule_id: uuid(),
		type: PlannedTransactionType.expense,
		memo: "Internet",
		amount: 50,
		targetAccount: my_accounts.afcu_checking.account_id,
		categoryId: flatCategoriesMap["Utilities"].category_id,
		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.JUN, 17))
	},

	{
		transaction_schedule_id: uuid(),
		type: PlannedTransactionType.expense,
		memo: "Preschool",
		amount: 170,
		targetAccount: my_accounts.afcu_checking.account_id,
		categoryId: flatCategoriesMap["Tuition"].category_id,
		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2024, MONTHS.SEP, 1), new Date(2025, MONTHS.MAY, 1))
	},


	/**
	 * SAVINGS
	 */
	{
		transaction_schedule_id: uuid(),
		type: PlannedTransactionType.transfer,
		memo: "Emergency Savings Transfer",
		amount: 300,
		targetAccount: my_accounts.afcu_savings.account_id,
		originAccount: my_accounts.afcu_checking.account_id,
		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.SEP, 1)),
		categoryId: flatCategoriesMap["Transfer"].category_id,
	},
];





export const budgets: Budget[] = [
	{
		budget_id: uuid(),
		name: 'Groceries',
		amount: 300,
		recurrenceSchedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.SEP, 1)),
		numMonths: 1,
		categoryId: flatCategoriesMap.Groceries.category_id,
		systemEventAccountId: my_accounts.afcu_checking.account_id,
	},
	{
		budget_id: uuid(),
		name: "Fuel",
		amount: 50,
		categoryId: flatCategoriesMap.Fuel.category_id,
		systemEventAccountId: my_accounts.afcu_checking.account_id,
		recurrenceSchedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 1)),
		numMonths: 1,
	},
	// Fun Money
	{
		budget_id: uuid(),
		name: "Fun Money",
		categoryId: flatCategoriesMap.Shopping.category_id,
		recurrenceSchedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 1)),
		amount: 150,
		systemEventAccountId: my_accounts.afcu_checking.account_id,
		numMonths: 1,
	},
	// Baby Care
	{
		budget_id: uuid(),
		name: "Baby Care",
		categoryId: flatCategoriesMap.Shopping.category_id,
		recurrenceSchedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 1)),
		amount: 50,
		systemEventAccountId: my_accounts.afcu_checking.account_id,
		numMonths: 1,
	},
];
