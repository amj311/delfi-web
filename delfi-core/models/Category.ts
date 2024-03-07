import type { DelfiDate } from "delfi-core/utils/dateUtils";
import Accumulator, { AccumulatorEvent, AccumulatorPeriod } from "./Accumulator";
import type { Budget, BudgetAccumulator, BudgetPeriod, BudgetSummary } from "./Budget";
import { type TransactionEvent, type PlannedTransaction, EventFlag } from "./Transaction";

type CategorySharedProps = {
	category_id: string,
	name: string,
}

export type SystemCategory = CategorySharedProps & {
	user_assignable?: boolean,
	parent_category_id?: string,
}

export type ParentCategory = SystemCategory & {
	children: Category[];
}

export type UserCategory = CategorySharedProps & {
	user_id: string,
	parent_category_id: string,
}

export type Category = SystemCategory | UserCategory;

export class CategorySummary {
	budgets!: BudgetSummary[];
	period!: AccumulatorPeriod;
	eventsBySchedule!: Map<PlannedTransaction | 'none', {total: number, events: TransactionEvent[]}>;

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
		this.eventsBySchedule = this.allEvents.reduce((map, event) => {
			const key = event.transaction.sourcePlannedTransaction || 'none';
			if (map.has(key)) {
				map.get(key)!.total += event.transaction.flags.includes(EventFlag.TRANSFER_COPY) ? 0 : event.transaction.amount;
				map.get(key)!.events.push(event.transaction);
			}
			else {
				map.set(key, {
					total: event.transaction.flags.includes(EventFlag.TRANSFER_COPY) ? 0 : event.transaction.amount,
					events: [event.transaction],
				});
			}
			return map;
		}, new Map<PlannedTransaction | 'none', {total: number, events: TransactionEvent[]}>());
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
