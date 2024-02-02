import { date } from "../../utils/dateUtils";
import { MONTHS } from "../../utils/constants";
import { Schedule } from "./Schedule";



export class XPerMonthSchedule extends Schedule {
    startDate;
    endDate;
    monthDays;

    constructor(public frequencyPerMonth, startDate, endDate?) {
        super();
        this.frequencyPerMonth = frequencyPerMonth;
        this.startDate = date(startDate);
        this.endDate = endDate ? date(endDate) : null;
        this.monthDays = [];
        let dayIval = Math.floor(30 / this.frequencyPerMonth);
        let offset = Math.min(30, this.startDate.date()) % dayIval;
        for (let day = offset; day <= 30; day += dayIval) {
            if (day !== 0)
                this.monthDays.push(day);
        }
    }

    getOccurrencesBetween(start, finish) {
        let currentDate = date(start);
        let end = date(finish);

        if (end.isBefore(this.startDate) || this.endDate?.isBefore(currentDate))
            return [];
        if (currentDate.isBefore(this.startDate))
            currentDate = date(this.startDate);
        if (this.endDate && this.endDate.isBefore(end))
            date(end = this.endDate);

        let occurrences: any[] = [];

        // For every month between start and end
        while (date(currentDate).isSameOrBefore(end)) {
            this.monthDays.forEach(day => {
                // Catch invalid February days
                // BUG: does not account for leap years
                if (currentDate.month() === MONTHS.FEB && day > 28)
                    day = 28;
                let occurrence = date(currentDate.date(day));
                if (occurrence.isSameOrAfter(start) && occurrence.isSameOrBefore(end)) {
                    occurrences.push(occurrence);
                }
            });
            currentDate.date(1);
            currentDate = date(currentDate.add(1, 'M'));
        }

        return occurrences;
    }
}
