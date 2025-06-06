import dayjs from "dayjs"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"
dayjs.extend(isSameOrBefore);
import UTC from "dayjs/plugin/UTC"
dayjs.extend(UTC);
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
dayjs.extend(isSameOrAfter);
import isBetween from "dayjs/plugin/isBetween"
dayjs.extend(isBetween);

type DelfiDateConfig = dayjs.ConfigType;
export type DelfiDate = dayjs.Dayjs & {
	isDelfiDate: true;
	isBetweenInclusive: (start: DelfiDate, end: DelfiDate) => boolean;
};

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