import { type Budget, type BudgetChildItem, type ProjectionEvent, type BudgetOccurrence, type ProjectionEventDetails } from "delfi-core/models/Budget";
import type { AttributionEvent, AttributionEventDetails, BudgetableTransactionDetails, Merchant } from "delfi-core/models/Transaction";
import { ddate, type DelfiDate } from "../utils/dateUtils";
import type { Category } from "./Category";


export type CommonEvent = BudgetableTransactionDetails & {
	displayName: string,
	date: DelfiDate,
	year: number;
	month: number;
	day: number;
	amount: number,
	
	Merchant?: Merchant | null,
	merchant_id?: string | null,
	Category?: Category | null,
	category_id?: string | null,
	Budget?: Budget | null,
	budget_id?: string | null,
	BudgetChildItem?: BudgetChildItem | null,
	budget_child_item_id?: string | null,

	attributionDetails?: AttributionEventDetails,
	projectionDetails?: ProjectionEventDetails,
};

export function netChange(events: { amount: number }[]): number {
	return events.reduce((acc, event) => acc + event.amount, 0);
}

/**
 * The occurrence of a budget, from start to end, with all events attributed to the occurrence within that time.
 */
export interface BudgetOccurrenceSummary extends BudgetOccurrence {}

export class BudgetOccurrenceSummary {
	constructor(
		readonly occurrence: BudgetOccurrence,
		readonly attributedEvents: AttributionEvent[],
	) {
		Object.assign(this, occurrence); // Copy all properties from occurrence
	}

	get budgetEvents(): BudgetEventSummary[] {
		return this.occurrence.budgetEvents.map(event => {
			// Right now the only link between attributions and specific events are child events.
			const attributedEvents = this.attributedEvents.filter(a => event.BudgetChildItem && a.budget_child_item_id === event.BudgetChildItem.budget_child_item_id);
			return new BudgetEventSummary(this, event, attributedEvents);
		});
	}
	// This setter is just to satisfy the interface, it doesn't actually do anything.
	set budgetEvents(value: BudgetEventSummary[]) {}

	get tally(): RealityTally {
		return new RealityTally(this.budgetEvents, this.attributedEvents);
	}

	snapshot(start: DelfiDate, end: DelfiDate): BudgetSnapshot {
		const budgetEvents = this.budgetEvents.filter(event => event.date.isBetweenInclusive(start, end));
		const attributedEvents = this.attributedEvents.filter(event => event.date.isBetweenInclusive(start, end));
		return new BudgetSnapshot(start, end, this.occurrence.budget, budgetEvents, attributedEvents, this);
	}
}

/** A single budgeted event with an occurrenceSummary and any applicable attributions */
export interface BudgetEventSummary extends ProjectionEvent {};
export class BudgetEventSummary {
	constructor (
		readonly occurrenceSummary: BudgetOccurrenceSummary,
		readonly budgetEvent: ProjectionEvent,
		readonly attributedEvents: AttributionEvent[],
	) {
		Object.assign(this, budgetEvent); // Copy all properties from budgetEvent
	}

	get tally(): RealityTally {
		return new RealityTally([this], this.attributedEvents);
	}
}

/**
 * An accounting of all occurrences of a budget and any real transactions attributed to it within a certain timeframe.
 * Provided events MAY be only a subset of the occurrence events, i.e. those belonging to a certain category.
 * There will USUALLY be only a single occurrence. When there are multiple, they are likely from triggered budgets rather than scheduled ones, and the occurrences would only be one-off events.
 * If it has multiple occurrences we'll assume they're just a bunch of one offs and treat them like events of one complete occurrence.
 * It can report over-spending within this budget, but not unattributed spending.
 * Created with occurrences because you CAN have a snapshot of an occurrence which has no events in it
 */
export class BudgetSnapshot {
	constructor(
		readonly rangeStart: DelfiDate | null,
		readonly rangeEnd: DelfiDate | null,
		readonly budget: Budget,
		/** Always just the events applicable to the snapshot (date range or other common attribute) */
		readonly budgetEvents: BudgetEventSummary[],
		readonly _attributedEvents: AttributionEvent[],
		readonly sourceOccurrence?: BudgetOccurrenceSummary, // only if this snapshot is of a single occurrence
	) {}

	/** Set of occurrences from which the budget events are drawn */
	private get occurrences(): BudgetOccurrenceSummary[] {
		if (this.sourceOccurrence) {
			return [this.sourceOccurrence];
		}
		const presentOccurrences = new Set<BudgetOccurrenceSummary>();
		this.budgetEvents.forEach(event => {
			if (event.projectionDetails.sourceOccurrence) {
				presentOccurrences.add(event.occurrenceSummary);
			}
		});
		const compiledOccurrences = Array.from(presentOccurrences);
		// if (compiledOccurrences.length === 0) {
		// 	console.warn(`BudgetSnapshot for budget ${this.budget.budget_id} has no occurrences associated with its events.`);
		// }
		return compiledOccurrences;
	}


	get withoutTransferCopies() {
		return this._attributedEvents.filter(e => !e.attributionDetails?.isTransferCopy);
	}

	/**
	 * For now, defaulting to NOT counting transfer copies. Still wondering what this will mean....
	 */
	get attributedEvents(): AttributionEvent[] {
		return this.withoutTransferCopies;
	}

	get childItemBudgets() {
		return this.budgetEvents.filter(e => Boolean(e.BudgetChildItem)).map(e => {
			const attributedEvents = this.attributedEvents.filter(a => a.budget_child_item_id === e.BudgetChildItem!.budget_child_item_id);
			return {
				...e,
				sourceChildItem: e.BudgetChildItem as NonNullable<BudgetChildItem>,
				/**
				 * Only events attributed to this child item within the snapshot range. There may be others.
				 */
				rangeAttributedEvents: attributedEvents,
				rangeTally: new RealityTally([e], attributedEvents),
			};
		});
	}

	get notChildBudgets() {
		return this.childItemBudgets.filter(e => !e.BudgetChildItem);
	}

	get notChildAttributions(): AttributionEvent[] {
		return this.attributedEvents.filter(e => !e.budget_child_item_id);
	}


	get tally(): RealityTally {
		return new RealityTally(this.budgetEvents, this.attributedEvents);
	}

	public get windowStart(): DelfiDate { return ddate(Math.min(...this.occurrences.map(o => o.start.valueOf()))) }
	public get windowEnd(): DelfiDate { return ddate(Math.max(...this.occurrences.map(o => o.end.valueOf()))) };


	/**
	 * Represents the full context that this snapshot window is a part of as "snapshot" of the whole.
	 * It is MOST often equivalent to a single monthly or yearly occurrence, but could potentially be
	 * multiple one-offs or a high-level view of multiple recurring.
	 */
	private get context(): BudgetSnapshot {
		const allBudgetEvents = this.occurrences.flatMap(o => o.budgetEvents);
		const allAttributedEvents = this.occurrences.flatMap(o => o.attributedEvents);

		return new BudgetSnapshot(
			ddate(this.windowStart),
			ddate(this.windowEnd),
			this.budget,
			allBudgetEvents,
			allAttributedEvents
		);
	}

	/**
	 * A tally representing the state of the budget BEFORE this snapshot range.
	 */
	private get beginningTally(): RealityTally {
		const budgetedEvents = this.budgetEvents.filter(e => e.date.isBefore(this.rangeStart!));
		const attributedEvents = this.attributedEvents.filter(e => e.date.isBefore(this.rangeStart!));
		return new RealityTally(budgetedEvents, attributedEvents);
	}

	/**
	 * Total of budgeted events prior to the start of the snapshot range.
	 */
	get budgetedBefore(): number {
		return this.beginningTally.budgetedNet;
	}
	/**
	 * Total of attributed events prior to the start of the snapshot range.
	 */
	get attributedBefore(): number {
		return this.beginningTally.attributedNet;
	}

	/**
	 * The budgeted amount for the TOTAL OCCURRENCE at the end of the snapshot range
	 */
	get budgetedAtEnd(): number {
		return this.budgetedBefore + this.tally.budgetedNet;
	}
	/**
	 * The attributed amount for the TOTAL OCCURRENCE at the end of the snapshot range
	 */
	get attributedAtEnd(): number {
		return this.attributedBefore + this.tally.attributedNet;
	}

	/**
	 * The remaining budget for this snapshot range
	 */
	get rangeBudgetRemaining(): number {
		return this.budgetedAtEnd - this.attributedAtEnd;
	}


	get totalOccurrenceBudgeted(): number {
		return this.context.tally.budgetedNet;
	}

	/**
	 * The remaining budget for the entire occurrence, not just the snapshot range.
	 * This is the total budgeted minus the total attributed at the end of the occurrence.
	 */
	get totalBudgetRemaining(): number {
		return this.totalOccurrenceBudgeted - this.attributedAtEnd;
	}


	progress(onDate: DelfiDate = ddate()) {
		const res = {
			isComplete: false,
			percent: 0,
			pace: 0,
			status: 'underPace' as 'underPace' | 'onPace' | 'overPace' | 'overBudget',
			visualization: {
				normalizedPace: 0, // normalized pace for visualization
				normalizedBudgetedNet: 0, // normalized budgeted net for visualization
				normalizedPercent: 0, // normalized percent for visualization
			}
		};

		// allow the budget target to be either positive or negative
		// compute percentages with the absolute value, then adjust the sign if needed
		const budgetedNet = Math.abs(this.tally.budgetedNet);
		const attributedNet = Math.abs(this.tally.attributedNet);
		if (!budgetedNet) {
			res.percent = 100;
			res.pace = 0;
		} else {
			res.percent = (attributedNet / budgetedNet) * 100;
			// // If the spent is NOT the same sign as the budgeted, use the sign to show it in the opposite direction
			// if (Math.sign(this.tally.budgetedNet) !== Math.sign(this.tally.attributedNet)) {
			// 	res.percent = -res.percent;
			// }
			res.pace = this.tally.budgetedNet > 0 ? attributedNet / budgetedNet : 0;
		}

		if (onDate && this.tally.budgetedNet !== 0) {
			const budgetedByDate = this.budgetEvents.filter(e => e.date.isSameOrBefore(onDate)).reduce((acc, e) => acc + e.amount, 0);
			res.pace = budgetedByDate / this.tally.budgetedNet * 100;
		}

		if (res.percent > 101) {
			res.status = 'overBudget';
		}
		else if (res.percent > (res.pace + 1)) {
			res.status = 'overPace';
		}
		else if (res.percent > (res.pace - 1)) {
			res.status = 'onPace';
		}
		else {
			res.status = 'underPace';
		}

		// compute normalized values for visualizations
		const max = Math.max(budgetedNet, attributedNet);
		const normalizedBudgetedNet = budgetedNet / max * 100;
		res.visualization = {
			normalizedPercent: attributedNet / max * 100,
			normalizedBudgetedNet: normalizedBudgetedNet,
			normalizedPace: res.pace * normalizedBudgetedNet / 100, // pace is a percentage of the budgeted net
		}

		// DETERMINE COMPLETION
		// consider complete if it was scheduled for a single day (like a bill) and already has at least some attribution
		// ATTEMPT: use projection schedule to detect once-only bills	
		const considerOnlyOnce = this.budget.onceAndDone || (this.occurrences.length === 1 && this.occurrences[0].sourceSchedule.projectionSchedule?.byDayOfMonth && this.occurrences[0].sourceSchedule.projectionSchedule.byDayOfMonth.length === 1);
		if (res.percent > 0 && considerOnlyOnce) {
			res.isComplete = true;
		}

		return res;
	}
}


/**
 * Given both budgets and transactions for a period of time, provides the comparison between the two.
 * Example: A single category over a month, both budgeted and unbudgeted expenses
 */
export class RealityTally<Grouper = any> {
	constructor(
		public readonly budgetEvents: BudgetEventSummary[] = [],
		/** ALL attribution events, both budgeted and unbudgeted */
		public readonly attributionEvents: AttributionEvent[] = [],
		public readonly grouper?: Grouper,
	) {}

	// When computing for ALL categories, we don't want to bother showing empty ones
	get hasInfo(): boolean {
		return this.budgetEvents.length > 0 || this.attributionEvents.length > 0;
	}

	get unBudgetedAttributions(): AttributionEvent[] {
		// ??? Does it need to be assigned to one of the specific budgets?
		return this.attributionEvents.filter(e => !e.budget_id)
		// .sort((a, b) => {
		// 	const aParentCategory = a.Category?.ParentCategory ? a.Category!.ParentCategory.name : a.Category?.name || 'Uncategorized';
		// 	const bParentCategory = b.Category?.ParentCategory ? b.Category!.ParentCategory.name : b.Category?.name || 'Uncategorized';
		// 	return aParentCategory.localeCompare(bParentCategory);
		// });
	}


	get budgetEventsWithoutTransferCopies(): ProjectionEvent[] {
		return this.budgetEvents.filter(e => !e.projectionDetails?.isTransferCopy);
	}

	/**
	 * NOTE This ALWAYS excludes transfer copies. I don't yet know of a situation where we would want to include them in the budgeted net.
	 */
	get budgetedNet(): number {
		return netChange(this.budgetEventsWithoutTransferCopies);
	}

	get attributedNet(): number {
		return netChange(this.attributionEvents);
	}

	get budgetedIncome(): number {
		return this.budgetEventsWithoutTransferCopies
			.filter((e) => e.Budget.Category?.type === 'INCOME')
			.reduce((sum, e) => sum + e.amount, 0);
	}
	
	get budgetedExpense(): number {
		return this.budgetEventsWithoutTransferCopies
			.filter((e) => !e.Budget.Category || e.Budget.Category.type === 'EXPENSE')
			.reduce((sum, e) => sum + e.amount, 0);
	}

	get attributedIncome(): number {
		return this.attributionEvents
			.filter((e) => e.Category?.type === 'INCOME')
			.reduce((sum, e) => sum + e.amount, 0);
	}
	
	get attributedExpense(): number {
		return this.attributionEvents
			.filter((e) => !e.Category || e.Category.type === 'EXPENSE')
			.reduce((sum, e) => sum + e.amount, 0);
	}

	get budgetRemaining(): number {
		return this.budgetedNet - this.attributedNet;
	}

	get unBudgetedNet(): number {
		return netChange(this.unBudgetedAttributions);
	}

	get budgetSnapshots() {
		const presentBudgets = new Map<string, Budget>();
		this.budgetEvents.forEach(event => {
			presentBudgets.set(event.Budget.budget_id, event.Budget);
		});
		this.attributionEvents.forEach(event => {
			if (event.budget_id && event.Budget) {
				presentBudgets.set(event.budget_id, event.Budget);
			}
		});
		return Array.from(presentBudgets.entries()).map(([budgetId, budget]) => new BudgetSnapshot(
			null, // rangeStart
			null, // rangeEnd
			budget,
			this.budgetEvents.filter(e => e.Budget.budget_id === budgetId),
			this.attributionEvents.filter(e => e.budget_id === budgetId),
		)).sort((a, b) => {
			const aParentCategory = a.budget.Category?.ParentCategory ? a.budget.Category!.ParentCategory.name : a.budget.Category?.name || 'Uncategorized';
			const bParentCategory = b.budget.Category?.ParentCategory ? b.budget.Category!.ParentCategory.name : b.budget.Category?.name || 'Uncategorized';
			return aParentCategory.localeCompare(bParentCategory);
		});
	}


	static fromTallies(tallies: RealityTally[]): RealityTally {
		const budgetEvents = tallies.flatMap(t => t.budgetEvents);
		const attributionEvents = tallies.flatMap(t => t.attributionEvents);
		return new RealityTally(budgetEvents, attributionEvents);
	}
}


export class SummaryUtils {
	public static getBudgetEventIdentifier(event: ProjectionEvent): string {
		const attributes = [
			['sourceBudget', event.Budget?.budget_id],
			['childItem', event.BudgetChildItem?.budget_child_item_id],
			['date', event.date.toISOString()],
		]
		return attributes.map(([key, value]) => `${key}:${value}`).join('__');
	}
}
