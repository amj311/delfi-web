import type { Schedule } from "./schedules/Schedule"
import type { Trigger } from "./schedules/triggers"

export enum TransactionType {
    "income" = "income",
    "expense" = "expense",
    "transfer" = "transfer"
}

type TransactionDetails = {
	type: TransactionType,
	memo: string,
	amount: number,
	targetAccount: string,
	originAccount?: string,
	categoryId?: string,
	tagIds?: string[],
}

export type TransactionSchedule = TransactionDetails & {
	id: string,
	recurrenceType: 'schedule' | 'trigger',
	schedule?: Schedule,
	trigger?: Trigger,
}

export type TransactionEvent = TransactionDetails & {
    id: string,
	transactionScheduleId: string,
	date: string,
}
