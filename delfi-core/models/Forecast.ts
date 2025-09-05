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
	readonly start: DelfiDate,
	readonly end: DelfiDate
}
interface Forecast extends ForecastProps {};
class Forecast {
	readonly transactionSchedules!: ScheduledBudget[];
	readonly transactionTriggers!: TriggeredBudget[];
	// readonly accumulatorMap: { [key: string]: Accumulator } = {};

	events: ProjectionEvent[] = [];
	occurrences: BudgetOccurrence[] = [];
	readyMonths: Map<string, MonthForecast> = new Map(); // Months that have been computed

	constructor(props: ForecastProps) {
		Object.assign(this, props);
		this.transactionSchedules = this.budgets.filter(s => s.recurrence_type === RecurrenceType.SCHEDULE) as ScheduledBudget[];
		this.transactionTriggers = this.budgets.filter(s => s.recurrence_type === RecurrenceType.TRIGGER) as TriggeredBudget[];
	}

    async computeForecast() {
		this.events = [];
		this.occurrences = [];

		// compute all scheduled events once first
		const scheduledOccurrences: BudgetOccurrence[] = [];
		for (let schedule of this.transactionSchedules) {
			scheduledOccurrences.push(...BudgetUtils.createScheduledOccurrences(this.start, this.end, schedule));
		}
		const scheduledEvents = scheduledOccurrences.flatMap(o => o.budgetEvents);

		// Compute just one month at a time
		let monthStart = this.start.startOf('month');
		while (monthStart < this.end) {
			const monthEnd = monthStart.endOf('month');
			await new Promise(resolve => setTimeout(resolve, 0)); // Yield to the event loop to avoid blocking the UI
			// These occurrences will include any that span the month, even if the have no events for the month
			const monthOccurrences = scheduledOccurrences.filter(o =>
				o.start.isSameOrBefore(monthEnd, 'month') &&
				o.end.isSameOrAfter(monthStart, 'month')
			);
			const monthEvents = FilterUtils.filter(scheduledEvents, [
				{ property: 'year', operator: 'eq', operand: monthStart.year() },
				{ property: 'month', operator: 'eq', operand: monthStart.month() },
			])
		
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
			monthStart = monthStart.add(1, 'month');
			this.events.push(...monthEvents);
			this.occurrences.push(...monthOccurrences);

			await new Promise(resolve => setTimeout(resolve, 0)); // Yield to the event loop to avoid blocking the UI
		}
    }

	pollMonthReady(month: DelfiDate) {
		return new Promise<MonthForecast>(res => {
			const waitTime = 500;
			const ctx = this;
			async function poll(){
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
