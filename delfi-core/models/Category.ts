import type { DelfiDate } from "delfi-core/utils/dateUtils";
import { type BudgetEvent, type BudgetOccurrence, type Budget, EventFlag } from "./Budget";

type CategoryType = 'INCOME' | 'TRANSFER' | 'EXPENSE';

type CategorySharedProps = {
	category_id: string,
	name: string,
	type: CategoryType,
}

export type ParentCategory = CategorySharedProps & {
	children: Category[];
}

export type ChildCategory = CategorySharedProps & {
	parent_category_id: string,
}

export type Category = ParentCategory | ChildCategory;

export type BudgetSummary = {
	budget: Budget,
	occurrences: OccurrenceSummary[],
}

export type OccurrenceSummary = BudgetOccurrence & {
	eventsInRange: BudgetEvent[],
}

export class CategorySummary {
	constructor(
		readonly start: DelfiDate,
		readonly end: DelfiDate,
		readonly category: Category,
		private readonly _occurrences: BudgetOccurrence[] = [],
		readonly children: CategorySummary[] = [],
	) {}

	get hasInfo(): boolean {
		return this.allOccurrences.length > 0;
	}

	get occurrences(): OccurrenceSummary[] {
		return this._occurrences.map(o => ({
			...o,
			eventsInRange: o.events.filter(e => e.date.isBetweenInclusive(this.start, this.end)),
		}));
	}

	get allOccurrences(): OccurrenceSummary[] {
		return [
			...this.occurrences,
			...this.children.reduce((acc, c) => acc.concat(c.allOccurrences), <OccurrenceSummary[]>[]),
		];
	}


	get budgetOccurrences() {
		const budgets = new Map<Budget, OccurrenceSummary[]>();
		this.occurrences.forEach(o => {
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

	get allBudgetOccurrences() {
		return [
			...this.budgetOccurrences,
			...this.children.reduce((acc, c) => acc.concat(c.allBudgetOccurrences), <{ budget_id: string, occurrences: OccurrenceSummary[] }[]>[]),
		];
	}

	/** Occurrences hold events for their entire window, which can be more than this summary */
	get events(): BudgetEvent[] {
		return this.occurrences.flatMap(o => o.eventsInRange);
	}

	get allEvents(): BudgetEvent[] {
		return [
			...this.events,
			...this.children.reduce((acc, c) => acc.concat(c.allEvents), <BudgetEvent[]>[]),
		];
	}

	get netChange(): number {
		return this.events.reduce((acc, event) => acc + event.amount, 0);
	}

	get allNetChange(): number {
		return this.allEvents.reduce((acc, event) => acc + event.amount, 0);
	}
}
