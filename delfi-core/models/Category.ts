import type { DelfiDate } from "delfi-core/utils/dateUtils";
import { type BudgetEvent, type BudgetOccurrence, type Budget } from "./Budget";
import type { PlaidCategory } from "server/services/PlaidService";
import type { IconName, TagColor } from "delfi-core/utils/constants";

type CategoryType = 'INCOME' | 'TRANSFER' | 'EXPENSE';

export type CategoryGroup = {
	group_id: string,
	name: string,
	color?: TagColor,
	icon?: IconName,
}

export type CategoryDetails = {
	category_id: string,
	name: string,
	type: CategoryType,
	group_id: string,
	icon?: IconName,
	detection_keys?: [PlaidCategory]
}

export type Category = CategoryDetails & {
	Group?: CategoryGroup,
}

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
		readonly category: CategoryDetails,
		private readonly _occurrences: BudgetOccurrence[] = [],
	) {}

	get hasInfo(): boolean {
		return this.allOccurrences.length > 0;
	}

	get occurrences(): OccurrenceSummary[] {
		return this._occurrences.map(o => ({
			...o,
			eventsInRange: o.budgetEvents.filter(e => e.date.isBetweenInclusive(this.start, this.end)),
		}));
	}

	get allOccurrences(): OccurrenceSummary[] {
		return this.occurrences;
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
		return this.budgetOccurrences;
	}

	/** Occurrences hold events for their entire window, which can be more than this summary */
	get events(): BudgetEvent[] {
		return this.occurrences.flatMap(o => o.eventsInRange);
	}

	get allEvents(): BudgetEvent[] {
		return this.events;
	}

	get netChange(): number {
		return this.events.reduce((acc, event) => acc + event.amount, 0);
	}

	get allNetChange(): number {
		return this.allEvents.reduce((acc, event) => acc + event.amount, 0);
	}
}
