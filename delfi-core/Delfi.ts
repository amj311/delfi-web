
/**
 * Central Delfi instance for registering all financial entities
 * and handling 
 */

import { type Account } from "./models/Account";
import { type Budget, type BudgetEvent, type BudgetOccurrence } from "./models/Budget";
import Forecast from "./models/Forecast";
import { type Category } from "./models/Category";
import { date, type DelfiDate, instantiateDates } from "./utils/dateUtils";
import type { TransactionFilter } from "./services/FilterService";
import FilterService from "./services/FilterService";
import { TransactionUtils, type AttributionEvent, type Transaction } from "./models/Transaction";
import { BudgetSnapshot, RealityTally } from "./models/Summary";

export type DelfiConfig = {
	readonly accounts: Account[],
	readonly budgets: Budget[],
	readonly categories: Category[],
	/**
	 * Requests transactions as needed to look farther back in time
	 * This will request a period (start to end) that is immediately before the earliest transaction currently loaded.
	 * Remember that end date is INCLUSIVE.
	 */
	loadTransactions: (start: DelfiDate, end: DelfiDate) => Promise<Transaction[]>,
	readonly start: DelfiDate,
	readonly end: DelfiDate,
}

export interface Delfi extends DelfiConfig {}

export class Delfi {
	public forecast!: Forecast;
	private loadedTransactions: Array<Transaction> = [];
	private attributedEvents: Array<AttributionEvent> = [];
	private currentTransactionStart: DelfiDate | null = null;

	constructor(config?: DelfiConfig) {
		if (config) {
			this.init(config);
		}
	}

	public init(config: DelfiConfig) {
		// Copy config so that it is not connected to external state
		this.loadTransactions = config.loadTransactions;
		this.loadedTransactions = [];
		this.attributedEvents = [];
		this.currentTransactionStart = null;
		const configCopy = instantiateDates(JSON.parse(JSON.stringify(config)));
		Object.assign(this, configCopy);
		// Put everything in the forecast
		this.forecast = new Forecast({
			budgets: this.budgets,
			start: this.start,
			end: this.end,
		});
	}

	public async computeForecast(): Promise<Forecast> {
		await this.forecast.computeForecast().catch(err => {
			console.error('Error computing forecast:', err);
			throw err;
		});
		console.log('Forecast computed successfully');
		return this.forecast;
	}

	private async getAttributedEventsBetween(start: DelfiDate, end: DelfiDate, filter: TransactionFilter = []): Promise<Array<AttributionEvent>> {
		// If we don't yet have transactions for this period, load them
		if (!this.currentTransactionStart || start.isBefore(this.currentTransactionStart)) {
			// Load up to either the forecast end or the last loaded start			
			const loadEnd = this.currentTransactionStart ? this.currentTransactionStart.subtract(1, 'day') : this.end;
			const newTransactions = await this.loadTransactions(start, loadEnd);
			this.loadedTransactions.push(...newTransactions);
			this.attributedEvents.push(...TransactionUtils.processAttributionEvents(newTransactions));
			this.currentTransactionStart = start;
		}
		// Filter the loaded transactions to the requested range
		return FilterService.filter(this.attributedEvents, [
			{ property: 'date', operator: 'gte', operand: start },
			{ property: 'date', operator: 'lte', operand: end },
			...filter,
		]);
	}

	/**
	 * Computes the accumulation of all transactions up to the given date BUT NOT INCLUDING, filtered by the provided filter.
	 * Not including because it should be the balance BEFORE anything that occurs on that date.
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
		const monthAttributionEvents = await this.getAttributedEventsBetween(monthStart, monthEnd);
		const monthBudgetEvents = monthForecast.events;
		const monthNet = monthBudgetEvents.reduce((acc, event) => acc + event.amount, 0);

		// compute each account's balance at the beginning and end of the month
		const accountSummaries = await Promise.all(this.accounts.map(async (account: Account) => {
			const monthStartBalance = account.current_balance + this.accumulateUpTo(monthStart, [
				{ property: 'account_id', operator: 'eq', operand: account.account_id },
			]);
			const accountEvents = FilterService.filter(monthBudgetEvents, [
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
					const partitionEvents = FilterService.filter(monthBudgetEvents, [
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

		const occurrencesByBudget: Map<Budget, BudgetOccurrence[]> = new Map();
		monthForecast.occurrences.forEach(event => {
			const occurrences = occurrencesByBudget.get(event.budget) || [];
			occurrences.push(event);
			occurrencesByBudget.set(event.budget, occurrences);
		});
		const budgetSummaries = Array.from(occurrencesByBudget.entries()).map(([budget, occurrences]) => {
			const attributedEvents = monthAttributionEvents.filter(e => e.budget_id === budget.budget_id && e.date.isBetweenInclusive(monthStart, monthEnd));
			return new BudgetSnapshot(
				monthStart,
				monthEnd,
				budget,
				occurrences,
				attributedEvents,
			);
		});

		const categorySummaries = this.categories.map((category: Category) => ({
			category,
			tally: new RealityTally(
				monthBudgetEvents.filter(o => o.category_id === category.category_id),
				monthAttributionEvents.filter(t => t.category_id === category.category_id),
			),
		}));
		const spendingCategories = categorySummaries.filter(c => c.category.type === 'EXPENSE');
		const spendingSummary = {
			categories: spendingCategories,
			tally: RealityTally.fromTallies(spendingCategories.map(c => c.tally)),
		};

		const incomeCategories = categorySummaries.filter(c => c.category.type === 'INCOME');
		const incomeSummary = {
			categories: incomeCategories,
			tally: RealityTally.fromTallies(incomeCategories.map(c => c.tally)),
		};

		const transferCategories = categorySummaries.filter(c => c.category.type === 'TRANSFER');
		const transferSummary = {
			categories: transferCategories,
			tally: RealityTally.fromTallies(transferCategories.map(c => c.tally)),
		};

		const groupBudgetEvents = new Map<string, Array<BudgetEvent>>();
		monthBudgetEvents.forEach(event => {
			if (!event.group_id) return; // Skip events without a group
			if (!groupBudgetEvents.has(event.group_id)) {
				groupBudgetEvents.set(event.group_id, []);
			}
			groupBudgetEvents.get(event.group_id)!.push(event);
		});

		return {
			netGrowth: monthNet,
			budgetEvents: monthBudgetEvents,
			attributionEvents: monthAttributionEvents,
			budgetSummaries: budgetSummaries,
			totalTally: new RealityTally(monthBudgetEvents, monthAttributionEvents),
			accountSummaries,
			categorySummaries,
			incomeSummary,
			transferSummary,
			spendingSummary,
			groupsEvents: Array.from(groupBudgetEvents.entries()).map(([groupId, events]) => ({
				groupId,
				events
			})),
		};
	}
}
