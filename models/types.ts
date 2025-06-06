import { type Trigger } from "../delfi-core/models/schedules/triggers";
import {
	type Account as AccountRaw,
	type AccountPartition as AccountPartitionRaw,
	type UserDefinedCategory,
	type PlannedTransaction as PlannedTransactionRaw,
	type Budget as BudgetRaw,
	type SavingsGoal as SavingsGoalRaw,
} from "@prisma/client";
import type { Schedule } from "../delfi-core/models/schedules/Schedule";
import { TransactionType, RecurrenceType } from "../delfi-core/models/Transaction";

type Replace<T1, T2> = Omit<T1, keyof T2> & T2;
type Maybe<T> = T | null;

export type Account = Replace<AccountRaw, {
	partitions: AccountPartition[],
	parent_account_id?: Maybe<string>,
	current_balance: number,
	available_balance: Maybe<number>,
	savings_goal?: SavingsGoal,
	excess_handling?: Maybe<{
		period: 'day' | 'week' | 'month' | 'year',
		target_account_id: string,
		target_partition_id?: Maybe<string>,
	}>,
}>

export type AccountPartition = Replace<AccountPartitionRaw, {
	savings_goal?: SavingsGoal,
}>

export type SavingsGoal = Replace<SavingsGoalRaw, {
	target_date?: Date,
	schedule_details?: object,
}>

export type Budget = Replace<BudgetRaw, {
	amount: number,
	schedule: Schedule,
}>

export type BudgetDbInput = Replace<Budget, {
	schedule: any,
}>;

export type PlannedTransaction = Replace<PlannedTransactionRaw, {
	type: TransactionType,
	recurrence_type: RecurrenceType,
	schedule: Maybe<Schedule>,
	trigger: Maybe<Trigger>,
	amount: number,
}>

export type PlannedTransactionDbInput = Replace<PlannedTransaction, {
	schedule: any,
	trigger: any,
}>;

export type UserCategory = UserDefinedCategory;