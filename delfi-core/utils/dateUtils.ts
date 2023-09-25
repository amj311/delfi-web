import dayjs from "dayjs"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"
dayjs.extend(isSameOrBefore);

const dayjsFormat = "YYYY-MM-DD"
export const newDate = date => {
    if (date.isMoment) return date
    if (typeof date === 'string') return dayjs(date, dayjsFormat)
    if (date instanceof Date) return dayjs(date.toISOString());
    else return dayjs(date)
}
export const format = date => {
    if (date.isMoment) return date.format(dayjsFormat)
    else return dayjs(date).format(dayjsFormat)
}

export const dateToValue = (date) => {
    const day = date.getUTCDate();
    const dayString = day < 10 ? `0${day}` : `${day}`;
    const month = date.getUTCMonth() + 1;
    const monthString = month < 10 ? `0${month}` : `${month}`;
    return `${date.getUTCFullYear()}-${monthString}-${dayString}`;
  };

  export const valueToDate = (value) => {
    const date = new Date(value);
    if (isNaN(date as any)) {
      return null;
    }
    const dateAccountingForTimezone = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return dateAccountingForTimezone;
  };
