import { newDate } from "../../utils/dateUtils";
import { Schedule } from "./Schedule";



export class OneTimeSchedule extends Schedule {
    date;

    constructor(date) {
        super();
        this.date = newDate(date);
    }

    getOccurrencesBetween(start, end) {
        start = newDate(start);
        end = newDate(end);

        if (end.isBefore(this.date) || this.date.isBefore(start))
            return [];
        else
            return [this.date];
    }
}
