import { MONTHS } from "../../delfi-core/utils/constants";
import { v4 as uuid } from "uuid";
import { flatCategoriesMap } from "../../delfi-core/models/systemCategories";
import { TransactionType, RecurrenceType, TransactionBudget } from "../../delfi-core/models/Budget";
import { date } from "../../delfi-core/utils/dateUtils";
import type { Account } from "../../delfi-core/models/Account";

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
		display_name: "AFCU Checking",
		current_balance: 200,
		available_balance: 200,
		partitions: [],
		...accountStuff,
	},
	afcu_savings: {
		account_id: uuid(),
		display_name: "AFCU Savings",
		current_balance: 5100,
		available_balance: 5100,
		partitions: [],
		...accountStuff,
	},
	us_savings: {
		account_id: uuid(),
		display_name: "US Bank",
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
		current_balance: 100,
		savings_goal: {
			savings_goal_id: 'test-savings-goal-id',
			account_partition_id: 'test-partition-id',
			target_balance: 7000,
			target_date: new Date(2024, MONTHS.SEP, 1),
			// schedule_details: {
			// 	budget_id: uuid(),
			// 	amount: 2100,
			// 	memo: "New Car Savings",
			// 	type: BudgetTransactionType.TRANSFER,
			// 	origin_account_id: my_accounts.afcu_checking.account_id,
			// 	user_id: 'myself',
			// 	schedule: { start: '2021-04-25', frequency: 'MONTHLY', byDayOfMonth: [25] },
			// 	category_id: flatCategoriesMap["Transfer"].category_id,
			// },	
		}
	}
];


export const my_scheduledTransactions: TransactionBudget[] = [
	/**
	 * EVERY MONTH
	 */
	{ 
		budget_id: uuid(),
		transactionType: TransactionType.DEBIT,
		memo: "Arthur Life Insurance",
		target_account_id: my_accounts.afcu_checking.account_id,
		recurrence_type: RecurrenceType.SCHEDULE,
		scheduleVariants: [{
			schedule: { start: '2021-04-05', frequency: 'MONTHLY', byDayOfMonth: [5] },
			amount: 300,
		}],
		category_id: flatCategoriesMap["Life Insurance"].category_id,
	},
	{ 
		budget_id: uuid(),
		transactionType: TransactionType.DEBIT,
		memo: "Rachel Life Insurance",
		amount: 70,
		target_account_id: my_accounts.afcu_checking.account_id,
		recurrence_type: RecurrenceType.SCHEDULE,
		scheduleVariants: [{
			schedule: { start: '2021-04-05', frequency: 'MONTHLY', byDayOfMonth: [5] },
			amount: 70,
		}],
		category_id: flatCategoriesMap["Life Insurance"].category_id
	},
	{ // Car Insurance
		budget_id: uuid(),
		transactionType: TransactionType.DEBIT,
		memo: "Car Insurance",
		amount: 81,
		target_account_id: my_accounts.afcu_checking.account_id,
		recurrence_type: RecurrenceType.SCHEDULE,
		scheduleVariants: [{
			schedule: { start: '2021-04-08', frequency: 'MONTHLY', byDayOfMonth: [8] },
			amount: 81,
		}],
		category_id: flatCategoriesMap["Auto Insurance"].category_id
	},

	{ // Clozd fulltime
		budget_id: uuid(),
		transactionType: TransactionType.CREDIT,
		memo: "Clozd Salary",
		amount: 3140,
		target_account_id:  my_accounts.afcu_checking.account_id,
		recurrence_type: RecurrenceType.SCHEDULE,
		scheduleVariants: [{
			schedule: { start: '2021-04-08', frequency: 'MONTHLY', byDayOfMonth: [14, 27] },
			amount: 3140,
		}],
		category_id: flatCategoriesMap["Paycheck"].category_id
	},
	{
		budget_id: uuid(),
		transactionType: TransactionType.DEBIT,
		memo: "Tithing",
		target_account_id: my_accounts.afcu_checking.account_id,
		category_id: flatCategoriesMap["Tithing"].category_id,
		recurrence_type: RecurrenceType.TRIGGER,
		triggerVariants: [{
			trigger: {
				type: 'immediateMatch',
				filter: [{
					property: 'transactionType',
					operator: 'eq',
					operand: TransactionType.CREDIT,
				}],
				computation: {
					operator: 'percent',
					operand: 10
				}
			},
		}]
	},
	{
		budget_id: uuid(),
		transactionType: TransactionType.DEBIT,
		memo: "Fast Offering",
		amount: 100,
		target_account_id: my_accounts.afcu_checking.account_id,
		category_id: flatCategoriesMap["Fast Offering"].category_id,
		recurrence_type: RecurrenceType.SCHEDULE,
		scheduleVariants: [{
			schedule: { start: '2022-05-07', frequency: 'MONTHLY', byDayOfMonth: [7] },
			amount: 100,
		}],
	},

	{
		budget_id: uuid(),
		transactionType: TransactionType.DEBIT,
		memo: "Mortgage",
		amount: 2445,
		target_account_id: my_accounts.afcu_checking.account_id,
		category_id: flatCategoriesMap["Mortgage & Rent"].category_id,
		recurrence_type: RecurrenceType.SCHEDULE,
		scheduleVariants: [{
			schedule: { start: '2022-06-17', frequency: 'MONTHLY', byDayOfMonth: [17] },
			amount: 2445,
		}],
	},
	{
		budget_id: uuid(),
		transactionType: TransactionType.DEBIT,
		memo: "HOA",
		amount: 215,
		target_account_id: my_accounts.afcu_checking.account_id,
		category_id: flatCategoriesMap["Home Services"].category_id,
		recurrence_type: RecurrenceType.SCHEDULE,
		scheduleVariants: [{
			schedule: { start: '2022-06-18', frequency: 'MONTHLY', byDayOfMonth: [18] },
			amount: 215,
		}],
	},
	{
		budget_id: uuid(),
		transactionType: TransactionType.DEBIT,
		memo: "Gas Bill",
		amount: 50,
		target_account_id: my_accounts.afcu_checking.account_id,
		category_id: flatCategoriesMap["Utilities"].category_id,
		recurrence_type: RecurrenceType.SCHEDULE,
		scheduleVariants: [{
			schedule: { start: '2022-06-18', frequency: 'MONTHLY', byDayOfMonth: [18] },
			amount: 50,
		}],
	},
	{
		budget_id: uuid(),
		transactionType: TransactionType.DEBIT,
		memo: "Power Bill",
		amount: 30,
		target_account_id: my_accounts.afcu_checking.account_id,
		category_id: flatCategoriesMap["Utilities"].category_id,
		recurrence_type: RecurrenceType.SCHEDULE,
		scheduleVariants: [{
			schedule: { start: '2022-06-17', frequency: 'MONTHLY', byDayOfMonth: [17] },
			amount: 30,
		}],
	},
	{
		budget_id: uuid(),
		transactionType: TransactionType.DEBIT,
		memo: "Internet",
		amount: 50,
		target_account_id: my_accounts.afcu_checking.account_id,
		category_id: flatCategoriesMap["Utilities"].category_id,
		recurrence_type: RecurrenceType.SCHEDULE,
		scheduleVariants: [{
			schedule: { start: '2022-06-17', frequency: 'MONTHLY', byDayOfMonth: [17] },
			amount: 50,
		}],
	},

	{
		budget_id: uuid(),
		transactionType: TransactionType.DEBIT,
		memo: "Preschool",
		amount: 170,
		target_account_id: my_accounts.afcu_checking.account_id,
		category_id: flatCategoriesMap["Tuition"].category_id,
		recurrence_type: RecurrenceType.SCHEDULE,
		scheduleVariants: [{
			schedule: { start: '2024-09-01', end: '2025-05-31', frequency: 'MONTHLY', byDayOfMonth: [1] },
			amount: 170,
		}],
	},

	/**
	 * SAVINGS
	 */
	{
		budget_id: uuid(),
		transactionType: TransactionType.TRANSFER,
		memo: "Emergency Savings Transfer",
		amount: 300,
		target_account_id: my_accounts.afcu_savings.account_id,
		origin_account_id: my_accounts.afcu_checking.account_id,
		recurrence_type: RecurrenceType.SCHEDULE,
		scheduleVariants: [{
			schedule: { start: '2022-09-01', frequency: 'MONTHLY', byDayOfMonth: [1] },
			amount: 300,
		}],
		category_id: flatCategoriesMap["Transfer"].category_id,
	},
	{
		budget_id: uuid(),
		transactionType: TransactionType.TRANSFER,
		memo: "To Car Fund",
		amount: 500,
		target_account_id: my_accounts.afcu_savings.account_id,
		target_account_partition_id: my_accounts.afcu_savings.partitions[0].account_partition_id, // New Car
		origin_account_id: my_accounts.afcu_checking.account_id,
		recurrence_type: RecurrenceType.SCHEDULE,
		scheduleVariants: [{
			schedule: { start: '2022-09-01', frequency: 'MONTHLY', byDayOfMonth: [1] },
			amount: 500,
		}],
		category_id: flatCategoriesMap["Transfer"].category_id,
	},


	// BROUGHT IN FROM OLD "BUDGETS"
	{
		budget_id: uuid(),
		memo: 'Groceries',
		amount: 300,
		schedule: { start: '2022-09-01', frequency: 'MONTHLY', byDayOfMonth: [1] },
		category_id: flatCategoriesMap.Groceries.category_id,
		transactionType: TransactionType.DEBIT,
		recurrence_type: RecurrenceType.SCHEDULE,
		scheduleVariants: [{
			schedule: { start: '2022-09-01', frequency: 'MONTHLY', byDayOfMonth: [1] },
			amount: 300,
			projectionInterval: {
				interval: 'week',
				quantity: 2,
			},
		}],
		target_account_id: my_accounts.afcu_checking.account_id,
	} as any,
	{
		budget_id: uuid(),
		memo: "Fuel",
		category_id: flatCategoriesMap.Fuel.category_id,
		transactionType: TransactionType.DEBIT,
		recurrence_type: RecurrenceType.SCHEDULE,
		scheduleVariants: [{
			schedule: { start: '2021-04-01', frequency: 'MONTHLY', byDayOfMonth: [1] },
			amount: 50,
		}],
		target_account_id: my_accounts.afcu_checking.account_id,
		num_months: 1,
	},
	// Fun Money
	{
		budget_id: uuid(),
		memo: "Fun Money",
		category_id: flatCategoriesMap.Shopping.category_id,
		transactionType: TransactionType.DEBIT,
		recurrence_type: RecurrenceType.SCHEDULE,
		scheduleVariants: [{
		schedule: { start: '2021-04-01', frequency: 'MONTHLY', byDayOfMonth: [1] },
			amount: 150,
		}],
		target_account_id: my_accounts.afcu_checking.account_id,
		num_months: 1,
	},
	// Baby Care
	{
		budget_id: uuid(),
		memo: "Baby Care",
		category_id: flatCategoriesMap.Shopping.category_id,
		transactionType: TransactionType.DEBIT,
		recurrence_type: RecurrenceType.SCHEDULE,
		scheduleVariants: [{
			schedule: { start: '2021-04-01', frequency: 'MONTHLY', byDayOfMonth: [1] },
			amount: 50,
		}],
		target_account_id: my_accounts.afcu_checking.account_id,
		num_months: 1,
	},



	// LARGE budgets with children

	{
		budget_id: uuid(),
		memo: 'Travel',
		category_id: flatCategoriesMap.Groceries.category_id,
		transactionType: TransactionType.DEBIT,
		recurrence_type: RecurrenceType.SCHEDULE,
		target_account_id: my_accounts.afcu_checking.account_id,
		scheduleVariants: [{
			schedule: { start: '2022-01-01', frequency: 'YEARLY' },
			amount: 2000,
			projectionInterval: {
				interval: 'month',
				quantity: 3,
			},
		}],
		childItems: [
			{
				budget_id: 'travel-budget-2025',
				category_id: flatCategoriesMap["Travel"].category_id,
				memo: 'Delta Flight to NYC',
				notes: 'Family summer trip',
				amount: 1200,
				date: date('2025-06-15'), // June 15, 2025
				transactionType: TransactionType.DEBIT,
				target_account_id: my_accounts.afcu_savings.account_id,
				target_account_partition_id: null,
			},
			{
				budget_id: 'travel-budget-2025',
				category_id: flatCategoriesMap["Travel"].category_id,
				memo: 'Hotel NYC',
				notes: '5 nights in Manhattan',
				amount: 1500,
				date: date('2025-06-16'), // June 16, 2025
				transactionType: TransactionType.DEBIT,
				target_account_id: my_accounts.afcu_savings.account_id,
				target_account_partition_id: null,
			},
			{
				budget_id: 'travel-budget-2025',
				category_id: flatCategoriesMap["Travel"].category_id,
				memo: 'Broadway Tickets',
				notes: 'Show for family',
				amount: 400,
				date: date('2025-06-18'), // June 18, 2025
				transactionType: TransactionType.DEBIT,
				target_account_id: my_accounts.afcu_savings.account_id,
				target_account_partition_id: null,
			},
		]
	},
];
