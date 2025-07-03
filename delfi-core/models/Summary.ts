import { type Budget, type BudgetChildItem, type BudgetEvent, type BudgetOccurrence } from "delfi-core/models/Budget";
import type { AttributionEvent, BudgetableTransactionDetails, Merchant } from "delfi-core/models/Transaction";
import type { DelfiDate } from "../utils/dateUtils";
import type { Category } from "./Category";


export type CommonEventDetails = BudgetableTransactionDetails & {
	displayName: string,
	date: DelfiDate,
	year: number;
	month: number;
	day: number;
	amount: number,
	sourceType: string,
	Merchant?: Merchant | null,
	Category?: Category | null,
};

export type CommonEvent = AttributionEvent | BudgetEvent;

export function netChange(events: { amount: number }[]): number {
	return events.reduce((acc, event) => acc + event.amount, 0);
}

/**
 * An accounting of all occurrences of a budget and any real transactions attributed to it within a certain timeframe.
 * There will USUALLY be only a single occurrence. When there are multiple, they are likely from triggered budgets rather than scheduled ones, and the occurrences would only be one-off events.
 * Thus it could report over-spending within this budget, but not unattributed spending.
 */
export class BudgetSnapshot {
	constructor(
		readonly rangeStart: DelfiDate,
		readonly rangeEnd: DelfiDate,
		readonly budget: Budget,
		readonly occurrences: BudgetOccurrence[],
		readonly attributedEvents: AttributionEvent[],
	) {}


	get budgetEvents(): BudgetEvent[] {
		return this.occurrences.flatMap(o => o.budgetEvents.filter(e => e.date.isBetweenInclusive(this.rangeStart, this.rangeEnd)));
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

	get tally(): RealityTally {
		return new RealityTally(this.budgetEvents, this.attributedEvents);
	}


	get budgetedAtEnd(): number {
		return this.budgetedBefore + this.tally.budgetedNet;
	}
	get attributedAtEnd(): number {
		return this.attributedBefore + this.tally.attributedNet;
	}

	get rangeBudgetRemaining(): number {
		return this.budgetedAtEnd - this.attributedAtEnd;
	}


	get totalOccurrencesNet(): number {
		return netChange(this.occurrences);
	}

	get totalBudgetRemaining(): number {
		return this.totalOccurrencesNet - this.attributedAtEnd;
	}
}


type BudgetEventWithAttributions = BudgetEvent & {
	tally: RealityTally,
};

/**
 * Given a collection of both type of events that belong to the same budget, extrapolates info about how the transactions stack up against the budgets.
 * Because budget events are generated on the fly, the assignments have to be through some sort of reproducible unique string.
 * The majority of assignments only need to happen at a budget level, not a specific event. But say we could if we wanted to.
 */
export class BudgetToRealitySummary {
	constructor(
		public readonly budget: Budget,
		public readonly budgetEvents: BudgetEvent[],
		public readonly attributionEvents: AttributionEvent[],
	) {}

	get tally(): RealityTally {
		return new RealityTally(this.budgetEvents, this.attributionEvents);
	}

	// get childItems(): Array<RealityTally<BudgetChildItem>> {
	// 	return this.budget.childItems?.map(item => {
	// 		const budgetEvents = this.budgetEvents.filter(e => e.sourceChildItem === item);
	// 		const attributionEvents = this.attributionEvents.filter(e => e.budget_child_item_id === item.budget_child_item_id);
	// 		return new RealityTally(budgetEvents, attributionEvents, item);
	// 	}) ?? [];
	// }
}


/**
 * Given both budgets and transactions for a period of time, provides the comparison between the two.
 * Example: A single category over a month, both budgeted and unbudgeted expenses
 */
export class RealityTally<Grouper = any> {
	constructor(
		public readonly budgetEvents: BudgetEvent[] = [],
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
		return this.attributionEvents.filter(e => !e.budget_id);
	}


	get budgetEventsWithoutTransferCopies(): BudgetEvent[] {
		return this.budgetEvents.filter(e => !e.isTransferCopy);
	}

	/**
	 * NOTE This ALWAYS excludes transfer copies. I don't yet know of a situation where we would want to include them in the budgeted net.
	 */
	get budgetedNet(): number {
		return netChange(this.budgetEvents.filter(e => !e.isTransferCopy));
	}

	get attributedNet(): number {
		return netChange(this.attributionEvents);
	}

	get budgetRemaining(): number {
		return this.budgetedNet - this.attributedNet;
	}

	get unBudgetedNet(): number {
		return netChange(this.unBudgetedAttributions);
	}

	get budgetSummaries() {
		const presentBudgets = new Map<string, Budget>();
		this.budgetEvents.forEach(event => {
			presentBudgets.set(event.sourceBudget.budget_id, event.sourceBudget);
		});
		this.attributionEvents.forEach(event => {
			if (event.budget_id && event.Budget) {
				presentBudgets.set(event.budget_id, event.Budget);
			}
		});
		return Array.from(presentBudgets.entries()).map(([budgetId, budget]) => new BudgetToRealitySummary(
			budget,
			this.budgetEvents.filter(e => e.sourceBudget.budget_id === budgetId),
			this.attributionEvents.filter(e => e.budget_id === budgetId),
		));
	}


	static fromTallies(tallies: RealityTally[]): RealityTally {
		const budgetEvents = tallies.flatMap(t => t.budgetEvents);
		const attributionEvents = tallies.flatMap(t => t.attributionEvents);
		return new RealityTally(budgetEvents, attributionEvents);
	}
}


export class SummaryUtils {
	public static getBudgetEventIdentifier(event: BudgetEvent): string {
		const attributes = [
			['sourceBudget', event.sourceBudget?.budget_id],
			['childItem', event.sourceChildItem?.budget_child_item_id],
			['date', event.date.toISOString()],
		]
		return attributes.map(([key, value]) => `${key}:${value}`).join('__');
	}
}
