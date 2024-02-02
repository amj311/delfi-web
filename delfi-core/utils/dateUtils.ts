import dayjs from "dayjs"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"
dayjs.extend(isSameOrBefore);
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
dayjs.extend(isSameOrAfter);

type DelfiDateConfig = dayjs.ConfigType;
export type DelfiDate = dayjs.Dayjs & {
	isDelfiDate: true;
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
	return d;
}
