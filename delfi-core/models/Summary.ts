import { EventFlag, type Budget, type BudgetEvent, type BudgetOccurrence } from "delfi-core/models/Budget";
import type { AttributionEvent } from "delfi-core/models/Transaction";
import type { DelfiDate } from "../utils/dateUtils";

export type CommonEvent = BudgetEvent | AttributionEvent;

export function netChange(events: CommonEvent[]): number {
	return events.reduce((acc, event) => acc + event.amount, 0);
}

/**
 * An accounting of a single budget occurrence and any real transactions attributed to it.
 * Thus it could report over-spending within this budget, but not unattributed spending.
 */
export class BudgetOccurrenceSummary {
	constructor(
		readonly budgetOccurrence: BudgetOccurrence,
		readonly attributedEvents: AttributionEvent[],
	) {}

	get budget(): Budget {
		return this.budgetOccurrence.budget;
	}

	get occurrence(): BudgetOccurrence {
		return this.budgetOccurrence;
	}
	
	public snapshot(rangeStart: DelfiDate, rangeEnd: DelfiDate): OccurrenceSnapshot {
		return new OccurrenceSnapshot(
			this,
			rangeStart,
			rangeEnd,
		);
	}
}

export class OccurrenceSnapshot {
	constructor(
		readonly occurrenceSummary: BudgetOccurrenceSummary,
		readonly rangeStart: DelfiDate,
		readonly rangeEnd: DelfiDate,
	) {}

	get budget(): Budget {
		return this.occurrenceSummary.budget;
	}

	get occurrence(): BudgetOccurrence {
		return this.occurrenceSummary.occurrence;
	}

	get budgetEvents(): BudgetEvent[] {
		return this.occurrenceSummary.budgetOccurrence.budgetEvents.filter(e => e.date.isBetweenInclusive(this.rangeStart, this.rangeEnd));
	}
	get attributedEvents(): AttributionEvent[] {
		return this.occurrenceSummary.attributedEvents.filter(e => e.date.isBetweenInclusive(this.rangeStart, this.rangeEnd));
	}

	private totalBefore(events: CommonEvent[]): number {
		return netChange(events.filter(e => e.date < this.rangeStart));
	}

	get budgetedBefore(): number {
		return this.totalBefore(this.budgetEvents);
	}
	get attributedBefore(): number {
		return this.totalBefore(this.attributedEvents);
	}
	get budgetedNet(): number {
		return netChange(this.budgetEvents);
	}
	get budgetedNetWithoutTransferCopies(): number {
		return netChange(this.budgetEvents.filter(e => !e.flags.includes(EventFlag.TRANSFER_COPY)));
	}
	get attributedNet(): number {
		return netChange(this.attributedEvents);
	}
	get budgetedAtEnd(): number {
		return this.budgetedBefore + this.budgetedNet;
	}
	get attributedAtEnd(): number {
		return this.attributedBefore + this.attributedNet;
	}

	get totalBudgetRemaining(): number {
		return this.occurrence.amount - this.attributedAtEnd;
	}
}

/**
 * Supports having multiple occurrences of the same budget, especially for triggered one-off occurrences.
 */
export type BudgetSummary = {
	budget: Budget,
	occurrences: OccurrenceSnapshot[],
}


/**
 * Given both budgets and transactions for a period of time, provides the comparison between the two.
 * Example: A single category over a month, both budgeted and unbudgeted expenses
 */
export class RealityTally {
	constructor(
		public readonly occurrenceSnapshots: OccurrenceSnapshot[] = [],
		/** ALL attribution events, both budgeted and unbudgeted */
		public readonly attributionEvents: AttributionEvent[] = [],
	) {}

	// When computing for ALL categories, we don't want to bother showing empty ones
	get hasInfo(): boolean {
		return this.occurrenceSnapshots.length > 0 || this.attributionEvents.length > 0;
	}

	/**
	 * Only those events in the date range.
	 */
	get budgetEvents(): BudgetEvent[] {
		return this.occurrenceSnapshots.flatMap(o => o.budgetEvents);
	}

	get unBudgetedAttributions(): AttributionEvent[] {
		// ??? Does it need to be assigned to one of the specific budgets?
		return this.attributionEvents.filter(e => !e.budget_id);
	}

	get budgetOccurrences() {
		const budgets = new Map<Budget, OccurrenceSnapshot[]>();
		this.occurrenceSnapshots.forEach(o => {
			if (!budgets.has(o.budget)) {
				budgets.set(o.budget, []);
			}
			budgets.get(o.budget)!.push(o);
		});
		return Array.from(budgets.entries()).map(([budget, occurrences]) => ({
			budget,
			occurrences,
		}));
	}

	get budgetNet(): number {
		return netChange(this.budgetEvents);
	}

	get realNet(): number {
		return netChange(this.attributionEvents);
	}

	get budgetRemaining(): number {
		return this.budgetNet - this.realNet;
	}

	get unBudgetedNet(): number {
		return netChange(this.unBudgetedAttributions);
	}




	static fromTallies(tallies: RealityTally[]): RealityTally {
		const occurrenceSnapshots = tallies.flatMap(t => t.occurrenceSnapshots);
		const attributionEvents = tallies.flatMap(t => t.attributionEvents);
		return new RealityTally(occurrenceSnapshots, attributionEvents);
	}
}
