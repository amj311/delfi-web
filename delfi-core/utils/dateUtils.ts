import dayjs from "dayjs"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"
import UTC from "dayjs/plugin/utc" // Fixed casing to match actual package name
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import isBetween from "dayjs/plugin/isBetween"
import type { Replace } from "./typeUtils";

// Register all plugins at once to avoid ordering issues
dayjs.extend(isSameOrBefore);
dayjs.extend(UTC);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);

type DelfiDateConfig = dayjs.ConfigType;
export type DelfiDate =
	{
		isDelfiDate: true;
		isBetweenInclusive: (start: DelfiDate, end: DelfiDate) => boolean;
		formatFull(): string;
	}
	& Replace<dayjs.Dayjs, {
		toString: () => string;
		add(...args: Parameters<dayjs.Dayjs['add']>): DelfiDate;
		subtract(...args: Parameters<dayjs.Dayjs['subtract']>): DelfiDate;
		startOf(unit: dayjs.ManipulateType): DelfiDate;
		endOf(unit: dayjs.ManipulateType): DelfiDate;
	}>
;

/**
 * Truncates all dates to start of day and always
 * outputs them as YYYY-MM-DD.
 * @param {DelfiDateConfig?} input Any date config. Defaults to now
 * @returns {DelfiDate}
 */
export const date = (input: DelfiDateConfig = new Date()) => {
	const d = dayjs(input).startOf('day') as DelfiDate;
	d.isDelfiDate = true;
	d.toString = () => d.format('YYYY-MM-DD');
	d.toJSON = () => d.format('YYYY-MM-DD');
	
	d.isBetweenInclusive = (start: DelfiDate, end: DelfiDate) => d.isBetween(start, end, 'day', '[]');
	d.formatFull = () => d.format('MMMM D, YYYY');

	const proxyMethods = [ 'add', 'subtract', 'startOf', 'endOf' ] as const;
	for (const method of proxyMethods) {
		// @ts-ignore
		d[method] = (...args) => date(dayjs(d)[method](...args));
	}
	return d;
}

export function toDelfiInterval(frequency: string): dayjs.ManipulateType {
	const rruleFrequencyDict = {
		DAILY: 'day',
		WEEKLY: 'week',
		MONTHLY: 'month',
		YEARLY: 'year',
	};
	if (frequency in rruleFrequencyDict) {
		return rruleFrequencyDict[frequency as keyof typeof rruleFrequencyDict] as dayjs.ManipulateType;
	} else {
		throw new Error(`Unsupported frequency: ${frequency}`);
	}
}


/**
 * Recursively checks for date string (YYYY-MM-DD) and converts it to a DelfiDate.
 * @param input 
 */
export function instantiateDates(input: Record<string, any>) {
	for (const key in input) {
		const value = input[key];
		if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
			input[key] = date(value);
		} else if (typeof value === 'object' && value !== null) {
			instantiateDates(value);
		}
	}
	return input;
}
