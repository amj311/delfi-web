import type { Schedule } from "./schedules/Schedule";
import Accumulator, { AccumulatorEvent, AccumulatorPeriod } from "./Accumulator";
import type { TransactionFilter } from "delfi-core/services/FilterService";
import TransactionService, { TransactionScheduleType, type TransactionEvent } from "../services/transactionService";
import { peek } from "../utils/miscUtils";
import { date, type DelfiDate } from "../utils/dateUtils";
import { v4 as uuid } from "uuid";

export type BudgetSummary = {
	budget: Budget,
	start: DelfiDate,
	end: DelfiDate,
	periods: BudgetPeriod[],
	events: AccumulatorEvent[],
	change: number,
}

export class Budget {
	constructor(
		readonly budget_id: string,
		readonly name: string,
		readonly amount: number,
		readonly recurrenceSchedule: Schedule,
		readonly numMonths: number,
		readonly systemEventAccountId: string,
		readonly categoryId?: string,
	) {}
}

export class BudgetPeriod extends AccumulatorPeriod {
	readonly months: AccumulatorPeriod[] = [];

	constructor(
		start: DelfiDate,
		end: DelfiDate,
		asOfDate: DelfiDate,
		startingBalance: number = 0,
		events = [],
	) {
		super(start, end, startingBalance, events);
		this.months.push(new AccumulatorPeriod(
			date(asOfDate.startOf('month')),
			date(asOfDate.endOf('month')),
			startingBalance,
		))
	}

	addEvent(event: AccumulatorEvent) {
		if (
			event.date < this.start ||
			event.date > this.end
		) {
			throw Error("Event date outside of budget period");
		}
		this.events.push(event);
		peek(this.months)?.events.push(event);
	}
}

export class BudgetAccumulator extends Accumulator {
	readonly budgetPeriods = <BudgetPeriod[]>[];
	private hasCurrentOrFutureOccurrence = true;

	constructor(
		readonly key: string,
		readonly startingBalance: number,
		readonly filter: TransactionFilter,
		readonly budget: Budget,
		readonly events: AccumulatorEvent[] = [],
		readonly periods: AccumulatorPeriod[] = [],
	) {
		super(key, startingBalance, filter, events, periods)
	}

	/**
	 * returns most recent period if active on the provided date
	 * @param asOfDate 
	 * @returns 
	 */
	private getCurrentBudgetPeriod(asOfDate: DelfiDate) {
		const lastPeriod = peek(this.budgetPeriods);
		if (!lastPeriod) return null;
		if (
			lastPeriod &&
			asOfDate >= lastPeriod.start &&
			asOfDate <= lastPeriod.end
		) {
			return lastPeriod;
		}
	}

	public getPeriodAtDate(asOfDate: DelfiDate): BudgetPeriod | null {
		// just make sure we have the first of the month
		for (const period of this.budgetPeriods) {
			if (asOfDate >= period.start && asOfDate <= period.end) {
				return period;
			}
		}
		return null;
	}

	public getSummary(start: DelfiDate, end: DelfiDate) {
		const periods = <BudgetPeriod[]>[];
		for (const period of this.budgetPeriods) {
			if (period.end < start) continue;
			if (period.start > end) break;
			periods.push(period);
		}
		const events = <AccumulatorEvent[]>[];
		for (const event of this.events) {
			if (event.date >= start && event.date <= end) {
				events.push(event);
			}
		}
		return {
			budget: this.budget,
			start,
			end,
			periods,
			events,
			change: events.length > 0
				? events[events.length - 1].endingBalance - events[0].startingBalance
				: 0,
		};
	}

	// Should be called every time the forecast creates a new accumulator period,
	// currently this is daily. Periods should always be consecutive.
	// Occurs before any transactions are processed
	_postCreatePeriod(newPeriod: AccumulatorPeriod): void {
		// Abort if periods have ended
		if (!this.hasCurrentOrFutureOccurrence) {
			return;
		}
		
		// Create first period
		if (this.budgetPeriods.length === 0) {
			return this.createFirstPeriod(newPeriod.start);
		}

		const currentPeriod = this.getCurrentBudgetPeriod(newPeriod.start);

		// If period is current to date, check month
		if (currentPeriod) {
			const currentMonth = peek(currentPeriod.months);
			if (!currentMonth) throw Error("There should always be a month in the current period");
			if (newPeriod.start > currentMonth?.end) {
				currentPeriod.months.push(new AccumulatorPeriod(
					date(newPeriod.start.startOf('month')),
					date(newPeriod.start.endOf('month')),
					currentMonth.endingBalance
				))
			}
			return;
		}

		// Otherwise advance entire period
		const lastPeriod = peek(this.budgetPeriods);
		if (!lastPeriod) throw Error("There should always be a last period");
		if (newPeriod.start > lastPeriod.end) {
			const nextOccurrence = this.getNextBudgetOccurrence(newPeriod.start);
			if (nextOccurrence) {
				this.pushBudgetPeriod(nextOccurrence, nextOccurrence);
			}
			else this.hasCurrentOrFutureOccurrence = false;
			return;
		}
	}

	private createFirstPeriod(asOfDate: DelfiDate) {
		const mostRecentOccurrence = TransactionService.getPreviousOccurrence(asOfDate, this.budget.recurrenceSchedule);

		// Most recent might not exist if budget hasn't started yet at all
		if (mostRecentOccurrence) {
			// check occurrence end
			const occurrenceEnd = date(mostRecentOccurrence.add(this.budget.numMonths, 'months'));
			if (occurrenceEnd >= asOfDate) {
				// this is the current period
				this.pushBudgetPeriod(mostRecentOccurrence, asOfDate, this.startingBalance);
				return;
			}
		}

		// if no period yet, check for next occurrence
		const nextOccurrence = this.getNextBudgetOccurrence(asOfDate);
		if (nextOccurrence) {
			this.pushBudgetPeriod(nextOccurrence, nextOccurrence, this.startingBalance);
			return;
		}

		// If we STILL don't have a period, there are none for the schedule.
		this.hasCurrentOrFutureOccurrence = false;
	}

	private getNextBudgetOccurrence(asOfDate: DelfiDate) {
		return TransactionService.getNextOccurrence(asOfDate, this.budget.recurrenceSchedule);
	}

	private pushBudgetPeriod(startDate: DelfiDate, asOfDate: DelfiDate, balance: number = 0) {
		this.budgetPeriods.push(new BudgetPeriod(
			startDate,
			date(startDate.add(this.budget.numMonths, 'months').subtract(1, 'day')),
			asOfDate,
			balance,
		));
	}

	_postProcessTransaction(transaction: TransactionEvent, newEvent: AccumulatorEvent): void {
		// _postCreatePeriod should keep the budget period up to date, so trust it here
		// Abort if periods have ended
		const currentPeriod = this.getCurrentBudgetPeriod(transaction.date);
		if (!this.hasCurrentOrFutureOccurrence || !currentPeriod) {
			return;
		}

		// Add event to budget period if within range.
		// Prior logic should have advanced range if event is after,
		// but event could still be before budget period begins.
		currentPeriod.addEvent(newEvent);
	}

	doEndOfDayTrigger(date: DelfiDate): TransactionEvent[] {
		const currentPeriod = this.getCurrentBudgetPeriod(date);
		if (this.hasCurrentOrFutureOccurrence && currentPeriod &&
			date.isSame(currentPeriod.end)
		) {
			// balance when accumulating expense will be negative, like -100 out of -300 total
			// so remainder is -300 - (-100) = -200
			const remainder = (-this.budget.amount) - currentPeriod.endingBalance;
			if (remainder < 0) {
				return [{
					id: uuid(),
					date,
					memo: 'Automatic Budget Depletion - ' + this.budget.name,
					type: TransactionScheduleType.expense,
					targetAccount: this.budget.systemEventAccountId,
					amount: remainder,
					budgetId: this.budget.budget_id,
					categoryId: this.budget.categoryId
				}]
			}
		}
		return []
	};

}
