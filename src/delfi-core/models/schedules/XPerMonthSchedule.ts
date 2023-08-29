import moment from "moment";
import { MONTHS } from "../../utils/constants";
import { newMoment } from "../../utils/dateUtils";
import { Schedule } from "./Schedule";



export class XPerMonthSchedule extends Schedule {
    startDate;
    endDate;
    monthDays;

    constructor(public frequencyPerMonth, startDate, endDate?) {
        super();
        this.frequencyPerMonth = frequencyPerMonth;
        this.startDate = newMoment(startDate);
        this.endDate = endDate ? newMoment(endDate) : null;
        this.monthDays = [];
        let dayIval = Math.floor(30 / this.frequencyPerMonth);
        let offset = Math.min(30, this.startDate.date()) % dayIval;
        for (let day = offset; day <= 30; day += dayIval) {
            if (day !== 0)
                this.monthDays.push(day);
        }
    }

    getOccurrencesBetween(start, finish) {
        let date = newMoment(start);
        let end = newMoment(finish);

        if (end.isBefore(this.startDate) || this.endDate?.isBefore(date))
            return [];
        if (date.isBefore(this.startDate))
            date = moment(this.startDate);
        if (this.endDate && this.endDate.isBefore(end))
            moment(end = this.endDate);

        let occurrences: any[] = [];

        // For every month between start and end
        while (date.isSameOrBefore(end)) {
            this.monthDays.forEach(day => {
                // Catch invalid February days
                // BUG: does not account for leap years
                if (date.month() === MONTHS.FEB && day > 28)
                    day = 28;
                let occurrence = newMoment(date).date(day);
                if (occurrence.isSameOrBefore(end) && date.isSameOrBefore(occurrence)) {
                    occurrences.push(occurrence);
                }
            });
            date.date(1);
            date = date.add(1, 'M');
        }

        return occurrences;
    }
}
