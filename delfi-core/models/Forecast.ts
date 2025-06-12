import { date, type DelfiDate } from "../utils/dateUtils";
import { type Budget, type ScheduledBudget, type BudgetEvent, type TriggeredBudget, RecurrenceType, type BudgetOccurrence } from "./Budget";
import BudgetService from "./Budget";
import FilterService from "../services/FilterService";
import { TransactionStore } from "./TransactionStore";

type Interval = 'day' | 'week' | 'month' | 'year';

type MonthForecast = {
	occurrences: BudgetOccurrence[],
	events: BudgetEvent[],
}

type ForecastProps = {
	// readonly accumulators: Accumulator[],
	readonly plannedTransactions: Budget[],
	readonly start: DelfiDate,
	readonly end: DelfiDate
}
interface Forecast extends ForecastProps {};
class Forecast {
	readonly transactionSchedules!: ScheduledBudget[];
	readonly transactionTriggers!: TriggeredBudget[];
	// readonly accumulatorMap: { [key: string]: Accumulator } = {};

	transactionStore = new TransactionStore();
	events: BudgetEvent[] = [];
	occurrences: BudgetOccurrence[] = [];
	readyMonths: Map<string, MonthForecast> = new Map(); // Months that have been computed

	constructor(props: ForecastProps) {
		Object.assign(this, props);
		// this.accumulatorMap = props.accumulators.reduce((accumulators, accumulator) => {
		// 	accumulators[accumulator.key] = accumulator;
		// 	return accumulators;
		// }, {});
		this.transactionSchedules = this.plannedTransactions.filter(s => s.recurrence_type === RecurrenceType.SCHEDULE) as unknown as ScheduledBudget[];
		this.transactionTriggers = this.plannedTransactions.filter(s => s.recurrence_type === RecurrenceType.TRIGGER) as unknown as TriggeredBudget[];
	}

    async computeForecast() {
		this.transactionStore = new TransactionStore();
		this.events = [];
		this.occurrences = [];

		console.log(this.transactionSchedules, this.transactionTriggers);
		// compute all scheduled events once first
		const scheduledOccurrences: BudgetOccurrence[] = [];
		for (let schedule of this.transactionSchedules) {
			scheduledOccurrences.push(...BudgetService.createOccurrencesFromSchedule(this.start, this.end, schedule));
		}
		console.log(scheduledOccurrences)
		const scheduledEvents = scheduledOccurrences.flatMap(o => o.events);

		// Compute just one month at a time
		let monthStart = this.start.startOf('month');
		while (monthStart < this.end) {
			const monthEnd = monthStart.endOf('month');
			await new Promise(resolve => setTimeout(resolve, 0)); // Yield to the event loop to avoid blocking the UI
			const monthOccurrences = scheduledOccurrences.filter(o =>
				o.start.isSameOrBefore(monthEnd, 'month') &&
				o.end.isSameOrAfter(monthStart, 'month')
			);
			const monthEvents = FilterService.filter(scheduledEvents, [
				{ property: 'year', operator: 'eq', operand: monthStart.year() },
				{ property: 'month', operator: 'eq', operand: monthStart.month() },
			])
		
			// Compute immediate triggers by letting them query the store for events from the current month matching their filter
			for (const transactionTrigger of this.transactionTriggers) {
				console.log('Processing transaction trigger:', transactionTrigger);
				const triggeredOccurrences = monthEvents.map(event =>
					BudgetService.createOccurrenceFromTrigger(event.date, transactionTrigger, event)
				).filter(Boolean) as BudgetOccurrence[];
				// this.transactionStore.addTransactions(triggeredEvents);
				monthOccurrences.push(...triggeredOccurrences);
				monthEvents.push(...triggeredOccurrences.flatMap(o => o.events));
			}

			// TODO compute cumulative triggers
		
			this.readyMonths.set(date(monthStart).toString(), {
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
