import { date } from "../../utils/dateUtils";
import { Schedule } from "./Schedule";



export class OneTimeSchedule extends Schedule {
    date;

    constructor(date) {
        super();
        this.date = date(date);
    }

    getOccurrencesBetween(start, end) {
        start = date(start);
        end = date(end);

        if (end.isBefore(this.date) || this.date.isBefore(start))
            return [];
        else
            return [this.date];
    }
}
