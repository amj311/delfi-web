import { newMoment } from "../../utils/dateUtils";
import { Schedule } from "./Schedule";



export class OneTimeSchedule extends Schedule {
    date;

    constructor(date) {
        super();
        this.date = newMoment(date);
    }

    getOccurrencesBetween(start, end) {
        start = newMoment(start);
        end = newMoment(end);

        if (end.isBefore(this.date) || this.date.isBefore(start))
            return [];
        else
            return [this.date];
    }
}
