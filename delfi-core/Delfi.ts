
/**
 * Central Delfi instance for registering all financial entities
 * and handling 
 */

import { type Account } from "./models/Account";
import { type Budget, type ProjectionEvent, type BudgetOccurrence } from "./models/Budget";
import Forecast from "./models/Forecast";
import { type Category } from "./models/Category";
import { ddate, type DelfiDate, instantiateDates } from "./utils/dateUtils";
import type { FilterBlock, TransactionFilter } from "./models/Filters";
import FilterUtils from "./models/Filters";
import { TransactionUtils, type AttributionEvent, type Transaction } from "./models/Transaction";
import { BudgetOccurrenceSummary, BudgetSnapshot, RealityTally, type BudgetEventSummary } from "./models/Summary";
import { jsonCopy, PromiseQueue } from "./utils/miscUtils";

export type DelfiConfig = {
	readonly accounts: Account[],
	readonly budgets: Budget[],
	readonly categories: Category[],
	/**
	 * Requests transactions as needed to look farther back in time
	 * This will request a period (start to end) that is immediately before the earliest transaction currently loaded.
	 * Remember that end date is INCLUSIVE.
	 */
	loadTransactions: (start: DelfiDate, end: DelfiDate, accounts?: Array<string>) => Promise<Transaction[]>,
	start: DelfiDate,
	end: DelfiDate,
}

export interface Delfi extends DelfiConfig {}

export class Delfi {
	public forecast!: Forecast;
	private transactionSource!: TransactionSource;
	private budgetOccurrenceSummaries: Map<string, BudgetOccurrenceSummary> = new Map();
	// private budgetEventSummaries: Map<string, BudgetEventSummary> = new Map();

	private summaryCache = new Map<string, any>();

	constructor(config?: DelfiConfig) {
		if (config) {
			this.init(config);
		}
	}

	public init(config: DelfiConfig) {
		// Reset things
		this.transactionSource = new TransactionSource(config.loadTransactions, config.end);
		this.budgetOccurrenceSummaries = new Map();
		// this.budgetEventSummaries = new Map();

		// Copy config so that it is not connected to external state
		const configCopy = instantiateDates(jsonCopy(config));
		Object.assign(this, configCopy);
		
		// Put everything in the forecast
		this.forecast = new Forecast({
			budgets: this.budgets,
			start: this.start,
			end: this.end,
		});
		this.summaryCache = new Map();
	}

	public async computeForecast(newDateRange?: { start?: DelfiDate, end?: DelfiDate }): Promise<Forecast> {
		await this.forecast.computeForecast(newDateRange).catch(err => {
			console.error('Error computing forecast:', err);
			throw err;
		});
		console.log('Forecast computed successfully');
		return this.forecast;
	}

	public async extendForecast(newDate: DelfiDate) {
		if (newDate.isAfter(this.end)) {
			this.end = newDate;
		}
		if (newDate.isBefore(this.start)) {
			this.start = newDate;
		}
		await this.computeForecast({ start: this.start, end: this.end });
	}


	/*********************************
	 * HYDRATED OCCURRENCE SUMMARIES *
	 *********************************/
	private async getOccurrenceSummaries(occurrences: BudgetOccurrence[]): Promise<BudgetOccurrenceSummary[]> {
		const summaries: BudgetOccurrenceSummary[] = [];
		for (const occurrence of occurrences) {
			const attributedEvents = await this.transactionSource.getAttributedEventsBetween(occurrence.start, occurrence.end, 
				{ property: 'budget_id', operator: 'eq', operand: occurrence.budget.budget_id },
			);
			const summary = this.budgetOccurrenceSummaries.get(occurrence.occurrence_id) || new BudgetOccurrenceSummary(occurrence, attributedEvents);
			this.budgetOccurrenceSummaries.set(occurrence.occurrence_id, summary);
			// for (const event of summary.budgetEvents) {
			// 	this.budgetEventSummaries.set(event.budget_event_id, event);
			// }
			summaries.push(summary);
		}
		return summaries;
	}

	async getMonthSummary(monthDate: DelfiDate) {
		// make extra sure we have the start and end date
		const monthStart = ddate(monthDate.startOf('month'));

		const cached = this.getMonthSummaryCache(monthStart);
		if (cached) {
			return cached;
		}

		const summary = await this.createMonthSummary(monthDate);

		this.setMonthSummaryCache(monthStart, summary);
		return summary;
	}


	private async createMonthSummary(monthDate: DelfiDate) {
		// make extra sure we have the start and end date
		const monthStart = ddate(monthDate.startOf('month'));
		const monthEnd = ddate(monthDate.endOf('month'));

		const monthForecast = await this.forecast.pollMonthReady(monthStart);
		const monthAttributionEvents = (await this.transactionSource.getAttributedEventsBetween(monthStart, monthEnd)).sort((a, b) => a.date.diff(b.date));
		console.log(monthAttributionEvents.map(e => e.date.formatShort()));

		const monthBudgetOccurrences = await this.getOccurrenceSummaries(monthForecast.occurrences);
		const monthBudgetSnapshots = monthBudgetOccurrences.map(o => o.snapshot(monthStart, monthEnd));

		const allSnapshotsByBudget: Map<Budget, BudgetSnapshot[]> = new Map();
		monthBudgetSnapshots.forEach(snapshot => {
			const budgets = allSnapshotsByBudget.get(snapshot.budget) || [];
			budgets.push(snapshot);
			allSnapshotsByBudget.set(snapshot.budget, budgets);
		});
		const consolidatedBudgetSnapshots = Array.from(allSnapshotsByBudget.entries()).map(([budget, snapshots]) => {
			return new BudgetSnapshot(
				monthStart,
				monthEnd,
				budget,
				snapshots.flatMap(s => s.budgetEvents),
				Array.from(new Set(snapshots.flatMap(s => s.attributedEvents))).sort((a, b) => a.date.diff(b.date)),
			);
		});

		// const budgetEventsByBudget: Map<Budget, BudgetEventSummary[]> = new Map();
		// const monthBudgetEvents = monthBudgetSnapshots.flatMap(snapshot => snapshot.budgetEvents);
		// monthBudgetEvents.forEach(event => {
		// 	const events = budgetEventsByBudget.get(event.Budget) || [];
		// 	events.push(event);
		// 	budgetEventsByBudget.set(event.Budget, events);
		// });
		// // Still need to include ongoing budget occurrences that have no projected events in the window
		// monthBudgetOccurrences.forEach(occurrence => {
		// 	if (!budgetEventsByBudget.has(occurrence.budget)) {
		// 		budgetEventsByBudget.set(occurrence.budget, []);
		// 	}
		// });
		// const budgetSummaries = Array.from(budgetEventsByBudget.entries()).map(([budget, budgetEvents]) => {
		// 	const attributedEvents = monthAttributionEvents.filter(e => e.budget_id === budget.budget_id && e.date.isBetweenInclusive(monthStart, monthEnd));
		// 	return new BudgetSnapshot(
		// 		monthStart,
		// 		monthEnd,
		// 		budget,
		// 		budgetEvents,
		// 		attributedEvents,
		// 	);
		// });

		const monthBudgetEvents = consolidatedBudgetSnapshots.flatMap(snapshot => snapshot.budgetEvents);

		const categorySummaries = this.categories.map((category: Category) => ({
			category,
			tally: new RealityTally(
				monthBudgetEvents.filter(o => o.category_id === category.category_id),
				monthAttributionEvents.filter(t => t.category_id === category.category_id),
			),
		}));
		const spendingCategories = categorySummaries.filter(c => c.category.type === 'EXPENSE');
		const spendingSummary = {
			// spending budgets are any budgets not in an income or transfer category
			budgets: consolidatedBudgetSnapshots.filter(b => !b.budget.category_id || b.budget.Category?.type === 'EXPENSE'),
			categories: spendingCategories,
			tally: RealityTally.fromTallies(spendingCategories.map(c => c.tally)),
		};

		const incomeCategories = categorySummaries.filter(c => c.category.type === 'INCOME');
		const incomeSummary = {
			budgets: consolidatedBudgetSnapshots.filter(c => c.budget.Category?.type === 'INCOME'),
			categories: incomeCategories,
			tally: RealityTally.fromTallies(incomeCategories.map(c => c.tally)),
		};

		const transferCategories = categorySummaries.filter(c => c.category.type === 'TRANSFER');
		const transferSummary = {
			budgets: consolidatedBudgetSnapshots.filter(c => c.budget.Category?.type === 'TRANSFER'),
			categories: transferCategories,
			tally: RealityTally.fromTallies(transferCategories.map(c => c.tally)),
		};

		const presentGroups = new Set<string>();
		monthBudgetEvents.forEach(event => {
			if (event.group_id) {
				presentGroups.add(event.group_id);
			}
		});
		monthAttributionEvents.forEach(event => {
			if (event.group_id) {
				presentGroups.add(event.group_id);
			}
		});
		const groupSummaries = Array.from(presentGroups).map(groupId => {
			const groupBudgetEvents = monthBudgetEvents.filter(event => event.group_id === groupId);
			const groupAttributionEvents = monthAttributionEvents.filter(event => event.group_id === groupId);
			return {
				groupId,
				tally: new RealityTally(groupBudgetEvents, groupAttributionEvents),
			};
		});


		// compute each account's balance at the beginning and end of the month
		// TODO: My current approach to get the account balance is WAY off! It pulls the account balance from the DB, but then aggregates ALL budget events in the entire forecast.
		// If I can confidently save the current account balance with each transaction, then I can pull the balance from the first transaction of this month.
		// That transaction may already be here, unless we're looking into the future. Then I just need a way to get the most recent transaction of all.
		const accountSummaries = await Promise.all(this.accounts.map(async (account: Account) => {
			// const monthStartBalance = account.current_balance + FilterService.accumulateUpTo(this.forecast.events, monthStart, [
			// 	{ property: 'account_id', operator: 'eq', operand: account.account_id },
			// ]);

			// Budgets with this account_id could be direct debits or credits, or a transfer INTO this account.
			const budgetSnapshots = monthBudgetSnapshots.filter(s => s.budget.account_id === account.account_id);
			const directAccumulation = budgetSnapshots.reduce((acc, snap) => acc + snap.budgetedAtEnd, 0);

			const budgetedTransfersOut = monthBudgetSnapshots.filter(s => s.budget.origin_account_id === account.account_id);
			const transferOutAccumulation = -1 * budgetedTransfersOut.reduce((acc, snap) => acc + snap.budgetedAtEnd, 0); // invert the value
			const monthAccumulation = directAccumulation + transferOutAccumulation;
			// const projectedEndBalance = monthStartBalance + monthAccumulation;

			const attributedEvents = monthAttributionEvents.filter(e => e.account_id === account.account_id);
			const attributedAccumulation = attributedEvents.reduce((acc, event) => acc + event.amount, 0);
			
			return {
				account_id: account.account_id,
				// startingBalance: monthStartBalance,
				// endingBalance: projectedEndBalance,
				budgetedChange: monthAccumulation,
				attributedChange: attributedAccumulation,
				// events: accountBudgetEvents,
				// partitions: await Promise.all(account.partitions.map(async partition => {
				// 	const partitionStartBalance = partition.current_balance + FilterService.accumulateUpTo(this.forecast.events, monthStart, [
				// 		{ property: 'target_account_partition_id', operator: 'eq', operand: partition.account_partition_id },
				// 	]);
				// 	const partitionEvents = FilterService.filter(monthBudgetEvents, [
				// 		{ property: 'target_account_partition_id', operator: 'eq', operand: partition.account_partition_id },
				// 		{ property: 'year', operator: 'eq', operand: monthEnd.year() },
				// 		{ property: 'month', operator: 'eq', operand: monthEnd.month() },
				// 	]);
				// 	const partitionAccumulation = partitionEvents.reduce((acc, event) => acc + event.amount, 0);
				// 	const partitionEndBalance = partitionStartBalance + partitionAccumulation;
				// 	return {
				// 		account_partition_id: partition.account_partition_id,
				// 		name: partition.name,
				// 		startingBalance: partitionStartBalance,
				// 		endingBalance: partitionEndBalance,
				// 		netChange: partitionAccumulation,
				// 		events: partitionEvents,
				// 	};
				// })),
			}
		}));

		// FORECAST COMPUTING
		// don't use consolidated snapshots, so we can see individual windows
		// exclude budgets considered completed or that are beyond there window (i.e. a weekly babysitting budget that went unused last week.)
		const unfinishedBudgets = monthBudgetSnapshots.filter(b => !b.windowEnd.isBefore(ddate()) && !b.progress().isComplete);
		const unfinishedBudgetEvents = unfinishedBudgets.flatMap(b => {
			// Include all events that push the budget beyond the attributed amount
			// Only include the amount of the event that is over the attributed amount
			const events: ProjectionEvent[] = [];
			let budgetSoFar = 0;
			b.budgetEvents.forEach(e => {
				// support both pos and neg budgets
				budgetSoFar += e.amount;
				if (Math.abs(budgetSoFar) > Math.abs(b.attributedAtEnd)) {
					events.push({
						...e,
						amount: Math.abs(budgetSoFar - b.attributedAtEnd) < Math.abs(e.amount) ? budgetSoFar - b.attributedAtEnd : e.amount,
					})
				}
			})
			return events;
		}).sort((a, b) => (a.projectionDetails?.windowEnd || a.date).diff((b.projectionDetails?.windowEnd || b.date)));
		// Without transfer
		const unfinishedNetEvents = unfinishedBudgetEvents.filter(t => !t.Budget.Category || t.Budget.Category.type !== 'TRANSFER');

		const totalTally = new RealityTally(monthBudgetEvents, monthAttributionEvents);
		// tally of unbudgeted events
		const allUnbudgeted = new RealityTally([], monthAttributionEvents.filter(t => !t.budget_id && (!t.category_id || t.Category?.type === 'EXPENSE')));

		console.log(monthAttributionEvents.map(e => e.date.formatShort()));
		console.log(allUnbudgeted.unBudgetedAttributions.map(e => e.date.formatShort()));
		console.log(spendingSummary.budgets.map(b => b.attributedEvents.flatMap(e => e.date.formatShort())));

		// tally of non-transfer events
		const netTally = new RealityTally(
			monthBudgetEvents.filter(t => !t.Budget.Category || t.Budget.Category.type !== 'TRANSFER'),
			monthAttributionEvents.filter(t => !t.Category || t.Category.type !== 'TRANSFER'),
		);

		const summary = {
			// Net growth = income + spending (negative). Ignore Transfers!
			budgetedNet: incomeSummary.tally.budgetedNet + spendingSummary.tally.budgetedNet,
			attributedNet: incomeSummary.tally.attributedNet + spendingSummary.tally.attributedNet,
			budgetEvents: monthBudgetEvents,
			attributionEvents: monthAttributionEvents,
			budgetSummaries: consolidatedBudgetSnapshots,
			forecast: {
				unfinishedBudgets,
				unfinishedBudgetEvents,
				unfinishedNetEvents,
				endNet: unfinishedNetEvents.reduce((sum, e) => sum + e.amount, 0) + (netTally.attributedNet || 0)
			},
			totalTally,
			allUnbudgeted,
			netTally,
			accountSummaries,
			categorySummaries,
			incomeSummary,
			transferSummary,
			spendingSummary,
			groupSummaries
		};

		return summary;
	}

	private summaryKey(monthStart: DelfiDate) {
		return monthStart.format('YYYY-MM-DD') + '__' + monthStart.endOf('month').format('YYYY-MM-DD');
	}

	private setMonthSummaryCache(monthStart: DelfiDate, summary: Awaited<ReturnType<typeof this.createMonthSummary>>) {
		const key = this.summaryKey(monthStart);
		this.summaryCache.set(key, summary);
	}

	private getMonthSummaryCache(monthStart: DelfiDate): Awaited<ReturnType<typeof this.createMonthSummary>> | null {
		const key = this.summaryKey(monthStart);
		return this.summaryCache.get(key) || null;
	}
}


class TransactionSource {
	private getEventsQueue = new PromiseQueue();
	private loadedTransactionStart: DelfiDate | null = null
	private loadedTransactions: Map<string, Transaction> = new Map();
	private attributedEvents: Map<string, AttributionEvent> = new Map();

	constructor(
		private readonly loadTransactions: DelfiConfig['loadTransactions'],
		private readonly initialEnd: DelfiDate,
	) {}

	public async getAttributedEventsBetween(start: DelfiDate, end: DelfiDate, filter: FilterBlock = null): Promise<Array<AttributionEvent>> {
	// use a promise queue to make sure we don't double-load transactions
	return await this.getEventsQueue.add(async () => {
		// If we don't yet have transactions for this period, load them
		if (!this.loadedTransactionStart || start.isBefore(this.loadedTransactionStart)) {
			// Load up to either the forecast end or the last loaded start			
			const loadEnd = this.loadedTransactionStart ? this.loadedTransactionStart.subtract(1, 'day') : this.initialEnd;
			const newTransactions = await this.loadTransactions(start, loadEnd);
			newTransactions.forEach(tx => this.loadedTransactions.set(tx.transaction_id, tx));
			TransactionUtils.processAttributionEvents(newTransactions).forEach(event => this.attributedEvents.set(event.attributionDetails.transaction_attribution_id, event));
			this.loadedTransactionStart = start;
		}
		// Filter the loaded transactions to the requested range
		return FilterUtils.filter(Array.from(this.attributedEvents.values()), { AND: [
			{ property: 'date', operator: 'gte', operand: start },
			{ property: 'date', operator: 'lte', operand: end },
			filter,
		]});
	});
}
}