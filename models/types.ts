import { ImmediateMatchTrigger, type Trigger } from "../delfi-core/models/schedules/triggers";
import {
	type Account as AccountRaw,
	type UserDefinedCategory,
	type AccountPartition as AccountPartitionRaw,
	type PlannedTransaction as PlannedTransactionRaw,
	type Budget as BudgetRaw,
} from "@prisma/client";
import type { Schedule } from "../delfi-core/models/schedules/Schedule";
import { PlannedTransactionType, RecurrenceType } from "../delfi-core/models/Transaction";

type Replace<T1, T2> = Omit<T1, keyof T2> & T2;
type Maybe<T> = T | null | undefined;

export type Account = Replace<AccountRaw, {
	partitions: AccountPartition[],
	current_balance: Maybe<number>,
	available_balance: Maybe<number>,
}>

export type AccountPartition = Replace<AccountPartitionRaw, {
	target_balance?: Maybe<number>,
	target_date?: Maybe<Date>,
	schedule_details?: Maybe<object>,
}>

export type Budget = Replace<BudgetRaw, {
	amount: number,
	schedule: Schedule,
}>

export type PlannedTransaction = Replace<PlannedTransactionRaw, {
	// type: PlannedTransactionType,
	// recurrence_type: RecurrenceType,
	schedule: Maybe<Schedule>,
	trigger: Maybe<Trigger>,
	amount: number,
}>

export type PlannedTransactionDbInput = Replace<PlannedTransaction, {
	schedule: any,
	trigger: any,
}>;

export type UserCategory = UserDefinedCategory;