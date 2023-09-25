import { AccountClass, type Account } from "./models/Account";
import { OneTimeSchedule } from "./models/schedules/OneTimeSchedule";
import { XPerMonthSchedule } from "./models/schedules/XPerMonthSchedule";
import { type TransactionSchedule, TransactionType } from "./models/transactions";
import { MONTHS } from "./utils/constants";

export const accounts: {[key: string]: Account} = {
	afcu_checking: {
		id: "AFCU_Checking",
		name: "AFCU Checking",
		initialBalance: 500,
	},
	afcu_savings: {
		id: "AFCU_Savings",
		name: "AFCU Savings",
		initialBalance: 5500,
	},
	rothIra: {
		id: "ROTH_IRA",
		name: "ROTH IRA",
		initialBalance: 6500,
	},
	us_savings: {
		id: "US_Bank",
		name: "US Bank",
		initialBalance: 22000,
	},
};

export const initialAccounts = Object.values(accounts);

export const scheduledTransactions: TransactionSchedule[] = [
	/**
	 * EVERY MONTH
	 */
	{ // Groceries
		id: "Groceries",
		type: TransactionType.expense,
		memo: "Groceries",
		amount: 300,
		targetAccount: accounts.afcu_checking.id,
		schedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 25))
	},
	{ // Groceries
		id: "Baby",
		type: TransactionType.expense,
		memo: "Baby Care",
		amount: 50,
		targetAccount: accounts.afcu_checking.id,
		schedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 25))
	},
	{ // Car Insurance
		id: "CarIns",
		type: TransactionType.expense,
		memo: "Car Insurance",
		amount: 81,
		targetAccount: accounts.afcu_checking.id,
		schedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 8))
	},
	{
		id: "Fuel",
		type: TransactionType.expense,
		memo: "Fuel",
		amount: 50,
		targetAccount: accounts.afcu_checking.id,
		schedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 8))
	},
	{ // Fun Money
		id: "Fun",
		type: TransactionType.expense,
		memo: "Fun Money",
		amount: 150,
		targetAccount: accounts.afcu_checking.id,
		schedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 25))
	},

	{ // Clozd fulltime
		id: "Full",
		type: TransactionType.income,
		memo: "Full TIme Salary",
		amount: 2712.5,
		targetAccount:  accounts.afcu_checking.id,
		schedule: new XPerMonthSchedule(2, new Date(2022, MONTHS.MAY, 14))
	},
	{
		id: "Tithing",
		type: TransactionType.expense,
		memo: "Tithing",
		amount: 542.5,
		targetAccount:  accounts.afcu_checking.id,
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.MAY, 28))
	},
	{
		id: "Fast Offering",
		type: TransactionType.expense,
		memo: "Fast Offering",
		amount: 100,
		targetAccount: accounts.afcu_checking.id,
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.MAY, 7))
	},

	/**
	 * HOME PURCHASE
	 */
	{
		id: "Down",
		type: TransactionType.expense,
		memo: "Down Payment",
		amount: 10000,
		targetAccount: accounts.us_savings.id,
		schedule: new OneTimeSchedule(new Date(2022, MONTHS.MAY, 5))
	},
	{
		id: "Closing",
		type: TransactionType.expense,
		memo: "Closing Costs",
		amount: 10000,
		targetAccount: accounts.us_savings.id,
		schedule: new OneTimeSchedule(new Date(2022, MONTHS.MAY, 5))
	},



	{
		id: "Subaru",
		type: TransactionType.income,
		memo: "Sell SUbaru",
		amount: 3000,
		targetAccount: accounts.us_savings.id,
		schedule: new OneTimeSchedule(new Date(2022, MONTHS.MAY, 20))
	},


	/**
	 * EVERY MONTH starting June
	 */
	{
		id: "Mortgage",
		type: TransactionType.expense,
		memo: "Mortgage",
		amount: 2160,
		targetAccount: accounts.afcu_checking.id,
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.JUN, 5))
	},
	{
		id: "HOA",
		type: TransactionType.expense,
		memo: "HOA",
		amount: 215,
		targetAccount: accounts.afcu_checking.id,
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.JUN, 5))
	},
	{
		id: "Utilities",
		type: TransactionType.expense,
		memo: "Utilities",
		amount: 175,
		targetAccount: accounts.afcu_checking.id,
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.JUN, 28))
	},
	{
		id: "Home Insurance",
		type: TransactionType.expense,
		memo: "Home Insurance",
		amount: 30,
		targetAccount: accounts.afcu_checking.id,
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.JUN, 8))
	},

	{
		id: "Health Insurance",
		type: TransactionType.expense,
		memo: "Health Insurance",
		amount: 514,
		targetAccount: accounts.afcu_checking.id,
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.JUN, 30))
	},



	/**
	 * SAVINGS AFTER MAY
	 */
	{
		id: "Car",
		type: TransactionType.transfer,
		memo: "New Car Fund",
		amount: 250,
		targetAccount: accounts.us_savings.id,
		originAccount: accounts.afcu_checking.id,
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.MAY, 30))
	},
	{
		id: "roth",
		type: TransactionType.transfer,
		memo: "RothIRA Fund",
		amount: 250,
		targetAccount: accounts.rothIra.id,
		originAccount: accounts.afcu_checking.id,
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.MAY, 30))
	},
	{
		id: "Emergency",
		type: TransactionType.transfer,
		memo: "Emergency Fund",
		amount: 500,
		targetAccount: accounts.afcu_savings.id,
		originAccount: accounts.afcu_checking.id,
		schedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.MAY, 30))
	},



	/**
	 * BIG ONE-TIMERS
	 */

	{
		id: "Register Car",
		type: TransactionType.expense,
		memo: "Register Car",
		amount: 200,
		targetAccount: accounts.afcu_savings.id,
		schedule: new OneTimeSchedule(new Date(2022, MONTHS.AUG, 30))
	},

]
