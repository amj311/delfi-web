import type { Schedule } from "./schedules/Schedule"

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
	schedule: Schedule,
}

export type TransactionEvent = TransactionDetails & {
    id: string,
	transactionScheduleId: string,
	date: string,
}
