import { date, type DelfiDate } from "../utils/dateUtils";
import { TransactionScheduleType, type TransactionSchedule, type TransactionEvent, type TransactionTrigger } from "./Transaction";
import TransactionService from "./Transaction";
import { ImmediateMatchTrigger } from "./schedules/triggers";
import { v4 as uuid } from "uuid";
import FilterService from "../services/FilterService";
import type Accumulator from "delfi-core/models/Accumulator";
import type { AccumulatorEvent, AccumulatorPeriod } from "delfi-core/models/Accumulator";
import { peek } from "../utils/miscUtils";
import type { Budget } from "./Budget";

type Interval = 'day' | 'week' | 'month' | 'year';

type ForecastEvent = {
	date: DelfiDate,
	transaction: TransactionEvent,
	accumulatorEvents: {
		[key: string]: AccumulatorEvent,
	}
}

class ForecastPeriod {
	constructor(
		readonly start: DelfiDate,
		readonly end: DelfiDate,
		readonly events: ForecastEvent[] = [],
		readonly accumulatorEvents: { [key: string]: AccumulatorEvent[] } = {},
		readonly accumulatorPeriods: { [key: string]: AccumulatorPeriod[] } = {},
	) {}

	addEvents(events: ForecastEvent[]) {
		this.events.push(...events);
		for (const event of events) {
			for (const key in event.accumulatorEvents) {
				if (!this.accumulatorEvents[key]) {
					this.accumulatorEvents[key] = [];
				}
				this.accumulatorEvents[key].push(event.accumulatorEvents[key]);
			}
		}
	}

	addFromPeriod(period: ForecastPeriod) {
		this.addEvents(period.events);
		for (const key in period.accumulatorPeriods) {
				if (!this.accumulatorPeriods[key]) {
					this.accumulatorPeriods[key] = [];
				}
				this.accumulatorPeriods[key].push(...period.accumulatorPeriods[key]);
		}
	}

	startingBalance(accumulatorKey: string) {
		return this.accumulatorPeriods[accumulatorKey]?.[0]?.startingBalance || 0;
	}

	endingBalance(accumulatorKey: string) {
		return peek(this.accumulatorPeriods[accumulatorKey])?.endingBalance || 0;
	}

	change(accumulatorKey: string) {
		return this.endingBalance(accumulatorKey) - this.startingBalance(accumulatorKey);
	}
}

class Timeline extends ForecastPeriod {
	constructor(
		readonly start: DelfiDate,
		readonly end: DelfiDate,
		readonly interval: Interval,
		readonly events: ForecastEvent[] = [],
		readonly accumulatorEvents: { [key: string]: AccumulatorEvent[] } = {},
		readonly periods: ForecastPeriod[] = [],
	) {
		super(start, end, events, accumulatorEvents);
	}
}

type ForecastProps = {
	readonly accumulators: Accumulator[],
	readonly transactionSchedules: TransactionSchedule[],
	readonly transactionTriggers: TransactionTrigger[],
	readonly start: DelfiDate,
	readonly end: DelfiDate
}
interface Forecast extends ForecastProps {};

class Forecast {
	readonly accumulatorMap: { [key: string]: Accumulator } = {};
	events: ForecastEvent[] = [];
	days: ForecastPeriod[] = [];

	constructor(props: ForecastProps) {
		Object.assign(this, props);
		this.accumulatorMap = props.accumulators.reduce((accumulators, accumulator) => {
			accumulators[accumulator.key] = accumulator;
			return accumulators;
		}, {});
		this.computeForecast();
	}

    private computeForecast() {
        const scheduledEventDates = TransactionService.generateScheduledDates(this.transactionSchedules, this.start, this.end);
    
		let events: ForecastEvent[] = [];
		let days: ForecastPeriod[] = [];
		let currentDate = date(this.start);
		let eventIdx = 0;

		while (currentDate <= date(this.end)) {
			// Create forecast period
			const dayPeriod = new ForecastPeriod(date(currentDate), date(currentDate));
			// Create accumulator periods
			for (const accumulator of this.accumulators) {
				dayPeriod.accumulatorPeriods[accumulator.key] = [accumulator.onDayStart(
					date(currentDate), date(currentDate)
				)];
			}

			// Gather events for day
			while (
				eventIdx < scheduledEventDates.length
				&& scheduledEventDates[eventIdx].date.isSame(currentDate))
			{
				// Compute event
				const schedule = scheduledEventDates[eventIdx].schedule;
				const newEvents = this.computeScheduleForDate(currentDate, schedule);
				events.push(...newEvents);
				dayPeriod.addEvents(newEvents);

				// Advance to next event for day
				eventIdx++;
			}

			// Handle endOfDay triggers before advancing date
			// Gather triggered events from each accumulator and allow each accumulator to process them
			for (const accumulator of this.accumulators) {
				const triggeredEvents = accumulator.doEndOfDayTrigger(currentDate);
				for (const event of triggeredEvents) {
					const forecastEvent: ForecastEvent = {
						date: currentDate,
						transaction: event,
						accumulatorEvents: {},
					}
					for (const accumulator of this.accumulators) {
						const accumulatorEvent = accumulator.processNextTransaction(event);
						if (accumulatorEvent) {
							forecastEvent.accumulatorEvents[accumulator.key] = accumulatorEvent;
						}
					}
					events.push(forecastEvent);
					dayPeriod.addEvents([forecastEvent]);
				}
			}

			// Go to next day
			days.push(dayPeriod);
			currentDate = date(currentDate.add(1, 'day'));
		}
		this.days = days;
		this.events = events;
    }

	private computeScheduleForDate(date: DelfiDate, schedule: TransactionSchedule): ForecastEvent[] {
		const events = <ForecastEvent[]><unknown>[];

		const transactionEvents = this.createEventsFromSchedule(date, schedule);

		// Create a ForecastEvent for each event with an accumulator event for each accumulator
		for (const event of transactionEvents) {
			const forecastEvent: ForecastEvent = {
				date: date,
				transaction: event,
				accumulatorEvents: {},
			}
			for (const accumulator of this.accumulators) {
				const accumulatorEvent = accumulator.processNextTransaction(event);
				if (accumulatorEvent) {
					forecastEvent.accumulatorEvents[accumulator.key] = accumulatorEvent;
				}
			}
			events.push(forecastEvent);
		}

 		return events;
	}

	private createEventsFromSchedule(date: DelfiDate, schedule: TransactionSchedule): TransactionEvent[] {
		const events: TransactionEvent[] = [];
		
		const scheduledEvents = TransactionService.createEventsFromSchedule(date, schedule);

		// Create triggered events
		for (const event of scheduledEvents) {
			events.push(event);
			for (let transactionTrigger of this.transactionTriggers) {
				const trigger = new ImmediateMatchTrigger(transactionTrigger.trigger as ImmediateMatchTrigger);
				if (FilterService.matches(trigger.filter, event)) {
					events.push(...TransactionService.createEventsFromTrigger(date, transactionTrigger, event))
				}
			}	
		}
		return events;
	}

	
	public getTimeline(start = this.start, end = this.end, interval: Interval = 'day') {
		if (date(start) < this.start) throw Error('Start date is before start of forecast');
		if (date(end) > this.end) throw Error('End date is after end of forecast');

		const timeline = new Timeline(start, end, interval);

		let currentPeriod = new ForecastPeriod(
			date(start),
			date(start.add(1, interval).subtract(1, 'day'))
		);
		timeline.periods.push(currentPeriod);

		for (const forecastDay of this.days) {
			// Advance period when necessary
			if (forecastDay.start > currentPeriod.end) {
				currentPeriod = new ForecastPeriod(
					date(currentPeriod.end.add(1, 'day')),
					date(currentPeriod.end.add(1, 'day')),
				);
				if (currentPeriod.end > date(end)) break;
				timeline.periods.push(currentPeriod);
			}

			// Skip date if before period
			if (forecastDay.start < currentPeriod.start) continue;
			
			// Add to period
			currentPeriod.addFromPeriod(forecastDay);
			timeline.addFromPeriod(forecastDay);
		}

		return timeline;
	}
}

export default Forecast;
