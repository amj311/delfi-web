import type { DelfiDate } from "delfi-core/utils/dateUtils";
import Accumulator, { AccumulatorEvent, AccumulatorPeriod } from "./Accumulator";
import type { Budget, BudgetAccumulator, BudgetPeriod, BudgetSummary } from "./Budget";

export type Category = {
	category_id: string,
	user_id?: string,
	name: string,
	parent_id?: string,
	children?: Category[],
}

export class CategorySummary {
	budgets!: BudgetSummary[];
	period!: AccumulatorPeriod;

	constructor(
		readonly start: DelfiDate,
		readonly end: DelfiDate,
		readonly category: Category,
		readonly accumulatorEvents: AccumulatorEvent[] = [],
		readonly budgetAccumulators: BudgetAccumulator[] = [],
		readonly children: CategorySummary[] = [],
	) {
		this.period = new AccumulatorPeriod(
			start,
			end,
			accumulatorEvents[0]?.startingBalance || 0,
			accumulatorEvents
		);
		this.budgets = budgetAccumulators.map(b => b.getSummary(start, end));
	}

	get hasInfo(): boolean {
		return this.allEvents.length > 0 ||
			this.budgets.some(b => b.periods.length > 0);
	}

	get netChange(): number {
		return this.period.change + this.children.reduce((acc, c) => acc + c.netChange, 0);
	}

	get allEvents(): AccumulatorEvent[] {
		// currently the category also accumulates budget events, so avoid double counting them
		return [
			...this.accumulatorEvents,
			...this.children.reduce((acc, c) => acc.concat(c.allEvents), <AccumulatorEvent[]>[]),
		];
	}
	
	get nonBudgetEvents(): AccumulatorEvent[] {
		return [
			...this.accumulatorEvents.filter(e => !e.transaction.budgetId),
			...this.children.reduce((acc, c) => acc.concat(c.nonBudgetEvents), <AccumulatorEvent[]>[]),
		]
	}

	get allBudgets(): BudgetSummary[] {
		return [
			...this.budgets,
			...this.children.reduce((acc, c) => acc.concat(c.allBudgets), <BudgetSummary[]>[]),
		]
	}
}
