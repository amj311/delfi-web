import type { DecimalJsLike } from "@prisma/client/runtime/library";
import { OneTimeSchedule } from "../../delfi-core/models/schedules/OneTimeSchedule";
import { XPerMonthSchedule } from "../../delfi-core/models/schedules/XPerMonthSchedule";
import { type TransactionSchedule, TransactionScheduleType } from "../../delfi-core/services/transactionService";
import { MONTHS } from "../../delfi-core/utils/constants";
import { type Account } from "@prisma/client";
import { v4 as uuid } from "uuid";
import { ImmediateMatchTrigger } from "../../delfi-core/models/schedules/triggers";

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
		current_balance: 2540,
	},
	afcu_savings: {
		account_id: uuid(),
		external_name: "asdfgtrf",
		custom_name: "AFCU Savings",
		current_balance: 5100,
	},
	us_savings: {
		account_id: uuid(),
		external_name: "asdfgtrf",
		custom_name: "US Bank",
		current_balance: 3000,
	},
};


export const my_scheduledTransactions: any[] = [
	/**
	 * EVERY MONTH
	 */
	{ // Groceries
		transaction_schedule_id: uuid(),
		type: TransactionScheduleType.expense,
		memo: "Groceries",
		amount: 300,
		targetAccount: my_accounts.afcu_checking.account_id,
		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 25))
	},
	{ 
		transaction_schedule_id: uuid(),
		type: TransactionScheduleType.expense,
		memo: "Arthur Life Insurance",
		amount: 300,
		targetAccount: my_accounts.afcu_checking.account_id,
		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 5))
	},
	{ 
		transaction_schedule_id: uuid(),
		type: TransactionScheduleType.expense,
		memo: "Rachel Life Insurance",
		amount: 70,
		targetAccount: my_accounts.afcu_checking.account_id,
		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 5))
	},
	{
		transaction_schedule_id: uuid(),
		type: TransactionScheduleType.expense,
		memo: "Baby Care",
		amount: 50,
		targetAccount: my_accounts.afcu_checking.account_id,

		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 25))
	},
	{ // Car Insurance
		transaction_schedule_id: uuid(),
		type: TransactionScheduleType.expense,
		memo: "Car Insurance",
		amount: 81,
		targetAccount: my_accounts.afcu_checking.account_id,

		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 8))
	},
	{
		transaction_schedule_id: uuid(),
		type: TransactionScheduleType.expense,
		memo: "Fuel",
		amount: 50,
		targetAccount: my_accounts.afcu_checking.account_id,

		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 8))
	},
	{ // Fun Money
		transaction_schedule_id: uuid(),
		type: TransactionScheduleType.expense,
		memo: "Fun Money",
		amount: 150,
		targetAccount: my_accounts.afcu_checking.account_id,

		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 25))
	},

	{ // Clozd fulltime
		transaction_schedule_id: uuid(),
		type: TransactionScheduleType.income,
		memo: "Clozd Salary",
		amount: 2540,
		targetAccount:  my_accounts.afcu_checking.account_id,

		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(2, new Date(2022, MONTHS.MAY, 14))
	},
	{
		transaction_schedule_id: uuid(),
		type: TransactionScheduleType.expense,
		memo: "Tithing",
		targetAccount: my_accounts.afcu_checking.account_id,
		recurrenceType: 'trigger',
		trigger: new ImmediateMatchTrigger({
			filter: [{
				property: 'amount',
				operator: 'gt',
				operand: 0,
			}],
			computation: {
				operator: 'percent',
				operand: 10
			}
		}),
	},
	{
		transaction_schedule_id: uuid(),
		type: TransactionScheduleType.expense,
		memo: "Fast Offering",
		amount: 100,
		targetAccount: my_accounts.afcu_checking.account_id,

		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.MAY, 7))
	},

	{
		transaction_schedule_id: uuid(),
		type: TransactionScheduleType.expense,
		memo: "Mortgage",
		amount: 2240,
		targetAccount: my_accounts.afcu_checking.account_id,

		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.JUN, 17))
	},
	{
		transaction_schedule_id: uuid(),
		type: TransactionScheduleType.expense,
		memo: "HOA",
		amount: 215,
		targetAccount: my_accounts.afcu_checking.account_id,

		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.JUN, 18))
	},
	{
		transaction_schedule_id: uuid(),
		type: TransactionScheduleType.expense,
		memo: "Utilities",
		amount: 175,
		targetAccount: my_accounts.afcu_checking.account_id,

		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.JUN, 28))
	},
	{
		transaction_schedule_id: uuid(),
		type: TransactionScheduleType.expense,
		memo: "Home Insurance",
		amount: 30,
		targetAccount: my_accounts.afcu_checking.account_id,

		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.JUN, 8))
	},

]
