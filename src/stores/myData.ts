import type { DecimalJsLike } from "@prisma/client/runtime/library";
import { OneTimeSchedule } from "../../delfi-core/models/schedules/OneTimeSchedule";
import { XPerMonthSchedule } from "../../delfi-core/models/schedules/XPerMonthSchedule";
import { type TransactionSchedule, TransactionType } from "../../delfi-core/models/transactions";
import { MONTHS } from "../../delfi-core/utils/constants";
import { type Account } from "@prisma/client";

const requiredstuff = {
	mask: "**** **** **** 0942",
	iso_currency_code: "USD",
	plaid_item_id: "afcu_checking",
	user_id: "myself",
}

export const my_accounts = {
	afcu_checking: {
		account_id: "afcu_checking",
		external_account_id: "afcu_checking",
		external_name: "asdfgtrf",
		custom_name: "AFCU Checking",
		type: "depository",
		subtype: "checking",
		current_balance: 500,
		available_balance: 500,
	},
	afcu_savings: {
		account_id: "afcu_savings",
		name: "AFCU Savings",
		balance: 5500,
	},
	rothIra: {
		account_id: "rothIra",
		name: "ROTH IRA",
		balance: 6500,
	},
	us_savings: {
		account_id: "us_savings",
		name: "US Bank",
		balance: 22000,
	},
};


export const my_scheduledTransactions: any[] = [
	/**
	 * EVERY MONTH
	 */
	{ // Groceries
		transaction_schedule_id: "Groceries",
		type: TransactionType.expense,
		memo: "Groceries",
		amount: 300,
		targetAccount: my_accounts.afcu_checking.account_id,
		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 25))
	},
	{ // Groceries
		transaction_schedule_id: "Baby",
		type: TransactionType.expense,
		memo: "Baby Care",
		amount: 50,
		targetAccount: my_accounts.afcu_checking.account_id,

		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 25))
	},
	{ // Car Insurance
		transaction_schedule_id: "CarIns",
		type: TransactionType.expense,
		memo: "Car Insurance",
		amount: 81,
		targetAccount: my_accounts.afcu_checking.account_id,

		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 8))
	},
	{
		transaction_schedule_id: "Fuel",
		type: TransactionType.expense,
		memo: "Fuel",
		amount: 50,
		targetAccount: my_accounts.afcu_checking.account_id,

		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 8))
	},
	{ // Fun Money
		transaction_schedule_id: "Fun",
		type: TransactionType.expense,
		memo: "Fun Money",
		amount: 150,
		targetAccount: my_accounts.afcu_checking.account_id,

		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 25))
	},

	{ // Clozd fulltime
		transaction_schedule_id: "Full",
		type: TransactionType.income,
		memo: "Full TIme Salary",
		amount: 2712.5,
		targetAccount:  my_accounts.afcu_checking.account_id,

		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(2, new Date(2022, MONTHS.MAY, 14))
	},
	{
		transaction_schedule_id: "Tithing",
		type: TransactionType.expense,
		memo: "Tithing",
		amount: 542.5,
		targetAccount:  my_accounts.afcu_checking.account_id,

		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.MAY, 28))
	},
	{
		transaction_schedule_id: "Fast Offering",
		type: TransactionType.expense,
		memo: "Fast Offering",
		amount: 100,
		targetAccount: my_accounts.afcu_checking.account_id,

		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.MAY, 7))
	},

	/**
	 * HOME PURCHASE
	 */
	{
		transaction_schedule_id: "Down",
		type: TransactionType.expense,
		memo: "Down Payment",
		amount: 10000,
		targetAccount: my_accounts.us_savings.account_id,

		recurrenceType: 'schedule',
		schedule: new OneTimeSchedule(new Date(2022, MONTHS.MAY, 5))
	},
	{
		transaction_schedule_id: "Closing",
		type: TransactionType.expense,
		memo: "Closing Costs",
		amount: 10000,
		targetAccount: my_accounts.us_savings.account_id,

		recurrenceType: 'schedule',
		schedule: new OneTimeSchedule(new Date(2022, MONTHS.MAY, 5))
	},



	{
		transaction_schedule_id: "Subaru",
		type: TransactionType.income,
		memo: "Sell SUbaru",
		amount: 3000,
		targetAccount: my_accounts.us_savings.account_id,

		recurrenceType: 'schedule',
		schedule: new OneTimeSchedule(new Date(2022, MONTHS.MAY, 20))
	},


	/**
	 * EVERY MONTH starting June
	 */
	{
		transaction_schedule_id: "Mortgage",
		type: TransactionType.expense,
		memo: "Mortgage",
		amount: 2160,
		targetAccount: my_accounts.afcu_checking.account_id,

		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.JUN, 5))
	},
	{
		transaction_schedule_id: "HOA",
		type: TransactionType.expense,
		memo: "HOA",
		amount: 215,
		targetAccount: my_accounts.afcu_checking.account_id,

		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.JUN, 5))
	},
	{
		transaction_schedule_id: "Utilities",
		type: TransactionType.expense,
		memo: "Utilities",
		amount: 175,
		targetAccount: my_accounts.afcu_checking.account_id,

		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.JUN, 28))
	},
	{
		transaction_schedule_id: "Home Insurance",
		type: TransactionType.expense,
		memo: "Home Insurance",
		amount: 30,
		targetAccount: my_accounts.afcu_checking.account_id,

		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.JUN, 8))
	},

	{
		transaction_schedule_id: "Health Insurance",
		type: TransactionType.expense,
		memo: "Health Insurance",
		amount: 514,
		targetAccount: my_accounts.afcu_checking.account_id,

		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.JUN, 30))
	},



	/**
	 * SAVINGS AFTER MAY
	 */
	{
		transaction_schedule_id: "Car",
		type: TransactionType.transfer,
		memo: "New Car Fund",
		amount: 250,
		targetAccount: my_accounts.us_savings.account_id,
		originAccount: my_accounts.afcu_checking.account_id,

		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.MAY, 30))
	},
	{
		transaction_schedule_id: "roth",
		type: TransactionType.transfer,
		memo: "RothIRA Fund",
		amount: 250,
		targetAccount: my_accounts.rothIra.account_id,
		originAccount: my_accounts.afcu_checking.account_id,

		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.MAY, 30))
	},
	{
		transaction_schedule_id: "Emergency",
		type: TransactionType.transfer,
		memo: "Emergency Fund",
		amount: 500,
		targetAccount: my_accounts.afcu_savings.account_id,
		originAccount: my_accounts.afcu_checking.account_id,

		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.MAY, 30))
	},



	/**
	 * BIG ONE-TIMERS
	 */

	{
		transaction_schedule_id: "Register Car",
		type: TransactionType.expense,
		memo: "Register Car",
		amount: 200,
		targetAccount: my_accounts.afcu_savings.account_id,

		recurrenceType: 'schedule',
		schedule: new OneTimeSchedule(new Date(2022, MONTHS.AUG, 30))
	},

]
