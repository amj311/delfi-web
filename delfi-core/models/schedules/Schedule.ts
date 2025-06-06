import { date, type DelfiDate } from "../../utils/dateUtils";
import { Schedule as rSchedule, type IOccurrencesArgs } from "./rSchedule";

export interface IRuleOptions {
	start: RuleOption.Start;
	end?: RuleOption.End;
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

export type Schedule = IRuleOptions;

export class ScheduleService {
	static getOccurrences(schedule: Schedule, options: IOccurrencesArgs): DelfiDate[] {
		let rrule = JSON.parse(JSON.stringify(schedule)) as IRuleOptions;
		rrule.start && (rrule.start = date(rrule.start));
		rrule.end && (rrule.end = date(rrule.end));
		return new rSchedule<null>({ rrules: [rrule] }).occurrences(options).toArray().map(d => date(d.date));
	}
}
