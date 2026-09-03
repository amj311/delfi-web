import type { Dayjs } from "dayjs";
import { ddate, type DelfiDate } from "../../utils/dateUtils";
import { Schedule as rSchedule, type IOccurrencesArgs } from "./rSchedule";
import dayjs from "dayjs";

export const WEEKDAYS = {
	SU: { label: 'Sunday', abbreviation: 'Sun', value: 'SU' },
	MO: { label: 'Monday', abbreviation: 'Mon', value: 'MO' },
	TU: { label: 'Tuesday', abbreviation: 'Tue', value: 'TU' },
	WE: { label: 'Wednesday', abbreviation: 'Wed', value: 'WE' },
	TH: { label: 'Thursday', abbreviation: 'Thu', value: 'TH' },
	FR: { label: 'Friday', abbreviation: 'Fri', value: 'FR' },
	SA: { label: 'Saturday', abbreviation: 'Sat', value: 'SA' },
} as const;

export interface IRuleOptions {
	start: Dayjs;
	end?: Dayjs;
	duration?: RuleOption.Duration;
	frequency: RuleOption.Frequency;
	interval?: RuleOption.Interval;
	count?: RuleOption.Count;
	weekStart?: RuleOption.WeekStart;
	byMillisecondOfSecond?: RuleOption.ByMillisecondOfSecond[];
	bySecondOfMinute?: RuleOption.BySecondOfMinute[];
	byMinuteOfHour?: RuleOption.ByMinuteOfHour[];
	byHourOfDay?: RuleOption.ByHourOfDay[];
	byDayOfWeek?: RuleOption.ByDayOfWeek[];
	byDayOfMonth?: RuleOption.ByDayOfMonth[];
	byMonthOfYear?: RuleOption.ByMonthOfYear[];
}

export namespace RuleOption {
	// Either a date object or a date adapter object.
	export type Start = any;
	// Either a date object or a date adapter object.
	export type End = any;
	// A length of time in milliseconds
	export type Duration = number;
	export type Interval = number;
	export type Count = number;
	export type WeekStart = 'SU' | 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA';
	export type Frequency =
		| 'MILLISECONDLY'
		| 'SECONDLY'
		| 'MINUTELY'
		| 'HOURLY'
		| 'DAILY'
		| 'WEEKLY'
		| 'MONTHLY'
		| 'YEARLY';

	/**
	 * The ByDayOfWeek type corresponds to either a two letter string for the weekday
	 * (i.e. 'SU', 'MO', etc) or an array of length two containing a weekday string
	 * and a number, in that order. The number describes the position of the weekday
	 * in the month / year (depending on other rules). It's explained pretty well
	 * in the [ICAL spec](https://tools.ietf.org/html/rfc5545#section-3.3.10).
	 * If the number is negative, it is calculated from the end of
	 * the month / year.
	 */
	export type ByDayOfWeek =
		| 'SU'
		| 'MO'
		| 'TU'
		| 'WE'
		| 'TH'
		| 'FR'
		| 'SA'
		| ['SU' | 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA', number];
	export type ByMillisecondOfSecond = number;
	export type BySecondOfMinute = number;
	export type ByMonthOfYear = number;
	export type ByMinuteOfHour = number;
	export type ByHourOfDay = number;
	export type ByDayOfMonth = number;
	export type ByWeekOfMonth = number;
}

export type SingleSchedule = IRuleOptions;
export type Schedule = SingleSchedule | Array<SingleSchedule>;

export class ScheduleService {
	/**
	 * Computes all occurrences of a schedule within the given options, including any ongoing ones at the time of the start date.
	 * @returns 
	 */
	static getOccurrences(schedule: Schedule, options: IOccurrencesArgs, includeOngoing: boolean = false): Array<Dayjs> {
		const arraySchedule = Array.isArray(schedule) ? schedule : [schedule];
		let rrules = JSON.parse(JSON.stringify(arraySchedule)) as IRuleOptions[];
		for (const rule of rrules) {
			rule.start && (rule.start = dayjs(rule.start));
			rule.end && (rule.end = dayjs(rule.end));
		}
		const recurrenceDates = new rSchedule<null>({ rrules }).occurrences(options).toArray().map(d => dayjs(d));
		// check for ongoing occurrence and include it
		if (includeOngoing) {
			const ongoingOccurrence = ScheduleService.delfi.getPreviousOccurrence(schedule, options.start);
			if (ongoingOccurrence && !ongoingOccurrence.isSame(recurrenceDates[0], 'day')) {
				recurrenceDates.unshift(ongoingOccurrence);
			}
		}
		return recurrenceDates;
	}

	static getNextOccurrence(schedule: Schedule, asOfDate: Dayjs = dayjs()): Dayjs | undefined {
		return this.getOccurrences(schedule, { start: asOfDate, take: 1 })[0];
	}

	static getPreviousOccurrence(schedule: Schedule, asOfDate: Dayjs = dayjs()): Dayjs | undefined {
		return this.getOccurrences(schedule, { end: asOfDate, take: 1, reverse: true })[0];
	}

	static delfi = {
		getOccurrences(...args: Parameters<typeof ScheduleService.getOccurrences>): DelfiDate[] {
			return ScheduleService.getOccurrences(...args).map(d => ddate(d));
		},
		getNextOccurrence(...args: Parameters<typeof ScheduleService.getNextOccurrence>): DelfiDate | undefined {
			const nextOccurrence = ScheduleService.getNextOccurrence(...args);
			return nextOccurrence ? ddate(nextOccurrence) : undefined;
		},
		getPreviousOccurrence(...args: Parameters<typeof ScheduleService.getPreviousOccurrence>): DelfiDate | undefined {
			const previousOccurrence = ScheduleService.getPreviousOccurrence(...args);
			return previousOccurrence ? ddate(previousOccurrence) : undefined;
		}
	}
}
