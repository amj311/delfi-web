import moment from "moment"

const momentFormat = "YYYY-MM-DD"
export const newMoment = date => {
    if (date.isMoment) return date
    if (typeof date === 'string') return moment(date, momentFormat)
    if (date instanceof Date) return moment(date.toISOString());
    else return moment(date)
}
export const format = date => {
    if (date.isMoment) return date.format(momentFormat)
    else return moment(date).format(momentFormat)
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
