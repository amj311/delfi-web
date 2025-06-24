
/**
 * Central Delfi instance for registering all financial entities
 * and handling 
 */

import { type Account } from "./models/Account";
import { type Budget } from "./models/Budget";
import Forecast from "./models/Forecast";
import { CategorySummary, type CategoryDetails, type OccurrenceSummary, type BudgetSummary } from "./models/Category";
import { date, type DelfiDate, instantiateDates } from "./utils/dateUtils";
import type { TransactionFilter } from "./services/FilterService";
import FilterService from "./services/FilterService";

export type DelfiConfig = {
	readonly accounts: Account[],
	readonly budgets: Budget[],
	readonly categories: CategoryDetails[],
	readonly start: DelfiDate,
	readonly end: DelfiDate,
}

export interface Delfi extends DelfiConfig {}

export class Delfi {
	public forecast!: Forecast;

	constructor(config?: DelfiConfig) {
		if (config) {
			this.init(config);
		}
	}

	public init(config: DelfiConfig) {
		// Copy config so that it is not connected to external state
		const configCopy = instantiateDates(JSON.parse(JSON.stringify(config)));
		Object.assign(this, configCopy);
		// Put everything in the forecast
		this.forecast = new Forecast({
			// accumulators,
			budgets: this.budgets,
			start: this.start,
			end: this.end,
		});
	}

	get flatCategories(): CategoryDetails[] {
		return this.categories;
	}

	public async computeForecast(): Promise<Forecast> {
		await this.forecast.computeForecast().catch(err => {
			console.error('Error computing forecast:', err);
			throw err;
		});
		console.log('Forecast computed successfully');
		return this.forecast;
	}


	/**
	 * Computes the accumulation of all transactions up to the given date BUT NOT INCLUDING, filtered by the provided filter.
	 * @param date 
	 * @param filter DO NOT INCLUDE DATES. These will be automatically computed.
	 */
	accumulateUpTo(date: DelfiDate, filter: TransactionFilter = []) {
		const thisFilter: TransactionFilter = [
			...filter,
			{ property: 'date', operator: 'lt', operand: date },
		];
		const matchingEvents = FilterService.filter(this.forecast.events, thisFilter);
		return matchingEvents.reduce((acc, event) => acc + event.amount, 0);
	}


	
	async getMonthSummary(monthDate: DelfiDate) {
		// make extra sure we have the start and end date
		const monthStart = date(monthDate.startOf('month'));
		const monthEnd = date(monthDate.endOf('month'));
		const monthForecast = await this.forecast.pollMonthReady(monthStart);
		const monthEvents = monthForecast.events;
		const monthOccurrences = monthForecast.occurrences;
		const monthNet = monthEvents.reduce((acc, event) => acc + event.amount, 0);

		// compute each account's balance at the beginning and end of the month
		const accountSummaries = await Promise.all(this.accounts.map(async (account: Account) => {
			const monthStartBalance = account.current_balance + this.accumulateUpTo(monthStart, [
				{ property: 'account_id', operator: 'eq', operand: account.account_id },
			]);
			const accountEvents = FilterService.filter(monthEvents, [
				{ property: 'account_id', operator: 'eq', operand: account.account_id },
				{ property: 'year', operator: 'eq', operand: monthEnd.year() },
				{ property: 'month', operator: 'eq', operand: monthEnd.month() },
			]);
			const monthAccumulation = accountEvents.reduce((acc, event) => acc + event.amount, 0);
			const monthEndBalance = monthStartBalance + monthAccumulation;
			return {
				account_id: account.account_id,
				startingBalance: monthStartBalance,
				endingBalance: monthEndBalance,
				netChange: monthAccumulation,
				events: accountEvents,
				partitions: await Promise.all(account.partitions.map(async partition => {
					const partitionStartBalance = partition.current_balance + this.accumulateUpTo(monthStart, [
						{ property: 'target_account_partition_id', operator: 'eq', operand: partition.account_partition_id },
					]);
					const partitionEvents = FilterService.filter(monthEvents, [
						{ property: 'target_account_partition_id', operator: 'eq', operand: partition.account_partition_id },
						{ property: 'year', operator: 'eq', operand: monthEnd.year() },
						{ property: 'month', operator: 'eq', operand: monthEnd.month() },
					]);
					const partitionAccumulation = partitionEvents.reduce((acc, event) => acc + event.amount, 0);
					const partitionEndBalance = partitionStartBalance + partitionAccumulation;
					return {
						account_partition_id: partition.account_partition_id,
						name: partition.name,
						startingBalance: partitionStartBalance,
						endingBalance: partitionEndBalance,
						netChange: partitionAccumulation,
						events: partitionEvents,
					};
				})),
			}
		}));

		const categorySummaries = this.categories.map((category: CategoryDetails) => (
			new CategorySummary(
				monthStart,
				monthEnd,
				category,
				monthOccurrences.filter(o => o.budget.category_id === category.category_id),
			)
		));
		const spendingCategories = categorySummaries.filter(c => c.category.type === 'EXPENSE');

		const incomeCategories = categorySummaries.filter(c => c.category.type === 'INCOME');
		const incomeSummary = {
			allEvents: incomeCategories.flatMap(c => c.allOccurrences),
			netChange: incomeCategories.reduce((acc, c) => acc + c.allNetChange, 0),
			categories: incomeCategories,
			occurrences: incomeCategories.reduce((acc, c) => acc.concat(c.allOccurrences), <OccurrenceSummary[]>[]),
			allBudgetOccurrences: incomeCategories.reduce((acc, c) => acc.concat(c.allBudgetOccurrences), <BudgetSummary[]>[]),
		};

		const transferCategories = categorySummaries.filter(c => c.category.type === 'TRANSFER');
		const transferSummary = {
			allEvents: transferCategories.flatMap(c => c.allOccurrences),
			allNetChange: transferCategories.reduce((acc, c) => acc + c.allNetChange, 0),
			categories: transferCategories,
			occurrences: transferCategories.reduce((acc, c) => acc.concat(c.allOccurrences), <OccurrenceSummary[]>[]),
		};

		return {
			netGrowth: monthNet,
			events: monthEvents,
			occurrences: monthOccurrences,
			accountSummaries,
			categorySummaries,
			incomeSummary,
			transferSummary,
			spendingCategories,
			spendingTotal: spendingCategories.reduce((acc, c) => acc + c.allNetChange, 0),
		};
	}
}
