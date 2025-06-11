import type { DelfiDate } from "delfi-core/utils/dateUtils"

export enum TransactionType {
	TRANSACTION = "TRANSACTION",
	TRANSFER = "TRANSFER",
	BALANCE_ADJUSTMENT = "BALANCE_ADJUSTMENT"
}

export type BaseTransactionDetails = {
	memo: string,
	transactionType: TransactionType,
	target_account_id: string,
	target_account_partition_id?: string | null,
	category_id?: string | null,
	tagIds?: string[],
}

export type TransactionEventDetails = BaseTransactionDetails & {
	amount: number,
	date: DelfiDate,
	original_description: string,
	pending?: boolean,
}
