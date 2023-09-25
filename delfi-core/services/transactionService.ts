import { type TransactionEvent, type TransactionSchedule } from "../models/transactions";

export default class TransactionService {
    static generateEventsBetween(start, end, tranSchedule: TransactionSchedule): TransactionEvent[] {
        let dates = tranSchedule.schedule.getOccurrencesBetween(start,end);
        return dates.map(d => ({
			...tranSchedule,
			transactionScheduleId: tranSchedule.id,
			date: d,
		} as TransactionEvent))
    }
}
