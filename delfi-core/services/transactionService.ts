import { v4 as uuid } from "uuid";
import { type TransactionEvent, type TransactionSchedule } from "../models/transactions";

export default class TransactionService {
    static generateEventsBetween(start, end, tranSchedule: TransactionSchedule): TransactionEvent[] {
        let dates = tranSchedule.schedule.getOccurrencesBetween(start,end);
        return dates.map(d => ({
			id: uuid(),
			type: tranSchedule.type,
			memo: tranSchedule.memo,
			amount: tranSchedule.amount,
			targetAccount: tranSchedule.targetAccount,
			originAccount: tranSchedule.originAccount,
			categoryId: tranSchedule.categoryId,
			tagIds: tranSchedule.tagIds,
			transactionScheduleId: tranSchedule.id,
			date: d,
		} as TransactionEvent))
    }
}
