import { ddate, type DelfiDate } from "../utils/dateUtils";
import { type Budget, type ScheduledBudget, type ProjectionEvent, type TriggeredBudget, RecurrenceType, type BudgetOccurrence } from "./Budget";
import BudgetUtils from "./Budget";
import FilterUtils from "./Filters";

type MonthForecast = {
	occurrences: BudgetOccurrence[],
	events: ProjectionEvent[],
}

type ForecastProps = {
	// readonly accumulators: Accumulator[],
	readonly budgets: Budget[],
	start: DelfiDate,
	end: DelfiDate
}
interface Forecast extends ForecastProps {};
class Forecast {
	readonly transactionSchedules!: ScheduledBudget[];
	readonly transactionTriggers!: TriggeredBudget[];
	// readonly accumulatorMap: { [key: string]: Accumulator } = {};

	occurrences: Map<string, BudgetOccurrence> = new Map();
	readyMonths: Map<string, MonthForecast> = new Map(); // Months that have been computed

	constructor(props: ForecastProps) {
		Object.assign(this, props);
		this.transactionSchedules = this.budgets.filter(s => s.recurrence_type === RecurrenceType.SCHEDULE) as ScheduledBudget[];
		this.transactionTriggers = this.budgets.filter(s => s.recurrence_type === RecurrenceType.TRIGGER) as TriggeredBudget[];
	}

    async computeForecast(newDateRange?: { start?: DelfiDate, end?: DelfiDate }) {
		if (newDateRange?.start && newDateRange?.start.isBefore(this.start)) {
			this.start = newDateRange.start;
		}
		if (newDateRange?.end && newDateRange?.end.isAfter(this.end)) {
			this.end = newDateRange.end;
		}

		// compute all scheduled events once first
		// But check cache to use already-computed ones if possible
		const scheduledOccurrences: BudgetOccurrence[] = [];
		for (let schedule of this.transactionSchedules) {
			const newOccurrences = BudgetUtils.createScheduledOccurrences(this.start, this.end, schedule);
			for (let occ of newOccurrences) {
				if (!this.occurrences.has(occ.occurrence_id)) {
					this.occurrences.set(occ.occurrence_id, occ);
				}
				scheduledOccurrences.push(this.occurrences.get(occ.occurrence_id)!);
			}
		}
		const scheduledEvents = scheduledOccurrences.flatMap(o => o.budgetEvents);

		// Compute just one month at a time
		let monthStart = this.start.startOf('month');
		while (monthStart < this.end) {
			// Skip if we've already computed this month
			if (!this.readyMonths.has(ddate(monthStart).toString())) {
				const monthEnd = monthStart.endOf('month');
				await new Promise(resolve => setTimeout(resolve, 0)); // Yield to the event loop to avoid blocking the UI
				// These occurrences will include any that span the month, even if the have no events for the month
				const monthOccurrences = scheduledOccurrences.filter(o =>
					o.start.isSameOrBefore(monthEnd, 'month') &&
					o.end.isSameOrAfter(monthStart, 'month')
				);
				const monthEvents = FilterUtils.filter(scheduledEvents, { AND: [
					{ property: 'year', operator: 'eq', operand: monthStart.year() },
					{ property: 'month', operator: 'eq', operand: monthStart.month() },
				]});

				// Compute immediate triggers by letting them query the store for events from the current month matching their filter
				const triggeredOccurrences = this.transactionTriggers.map(budget =>
					BudgetUtils.createTriggeredOccurrenceForMonth(monthStart, budget, monthEvents)
				).filter(Boolean) as BudgetOccurrence[];

				monthOccurrences.push(...triggeredOccurrences);
				monthEvents.push(...triggeredOccurrences.flatMap(o => o.budgetEvents));

				// TODO compute cumulative triggers
			
				this.readyMonths.set(ddate(monthStart).toString(), {
					occurrences: monthOccurrences,
					events: monthEvents,
				});
			}

			monthStart = monthStart.add(1, 'month');
			await new Promise(resolve => setTimeout(resolve, 0)); // Yield to the event loop to avoid blocking the UI
		}
    }

	pollMonthReady(month: DelfiDate) {
		return new Promise<MonthForecast>(res => {
			const waitTime = 500;
			const ctx = this;
			async function poll() {
				const monthRecord = ctx.readyMonths.get(month.toString());
				if (monthRecord) {
					return res(monthRecord);
				}
				setTimeout(poll, waitTime);
			}
			poll();
		})
	}
}

export default Forecast;
