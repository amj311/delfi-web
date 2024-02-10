import type { Schedule } from "./schedules/Schedule"
import Accumulator, { AccumulatorEvent, AccumulatorPeriod } from "./Accumulator"
import TransactionService, { PlannedTransactionType, type PlannedTransaction, type TransactionEvent } from "./Transaction"
import { v4 as uuid } from "uuid"
import { date, type DelfiDate } from "../utils/dateUtils"
import { peek } from "../utils/miscUtils"

export type AccountPartition = {
	partition_id: string,
	name: string,
	balance: number,
	target?: number,
	target_date?: string,
	transferSchedule: PlannedTransaction
}

export type Account = {
	account_id: string,
	name: string,
	current_balance: number,
	partitions: AccountPartition[],
}

class AccountPeriod {
	partitionPeriods!: { [key: string]: AccumulatorPeriod };

	constructor(
		readonly totalPeriod: AccumulatorPeriod,
		partitions: AccountPartition[],
		previousBalances: { [key: string]: number } = {},
		readonly start = totalPeriod.start,
		readonly end = totalPeriod.end,
	) {
		this.partitionPeriods = Object.fromEntries(partitions.map(partition => (
			[partition.partition_id, new AccumulatorPeriod(this.start, this.end, previousBalances[partition.partition_id] || partition.balance)])
		));
	}
}

export class AccountAccumulator extends Accumulator {
	private nextPartitionTransfer: { [key: string]: DelfiDate | undefined } = {};
	private accountPeriods: AccountPeriod[] = [];

	constructor(
		readonly account: Account,
		readonly start: DelfiDate,
		readonly startingBalance: number = account.current_balance,
	) {
		super(
			account.account_id,
			startingBalance,
			[{
				property: 'targetAccount',
				operator: 'eq',
				operand: account.account_id
			}]
		);
		// Get first next transfer dates
		for (const partition of account.partitions) {
			if (partition.transferSchedule) {
				this.nextPartitionTransfer[partition.partition_id] = TransactionService.getNextOccurrence(start, partition.transferSchedule.schedule);
			}
		}
	}

	// track the balance of partitions day by day
	_postCreatePeriod(newPeriod: AccumulatorPeriod): void {
		const lastPeriod = peek(this.accountPeriods);
		this.accountPeriods.push(new AccountPeriod(
			newPeriod, this.account.partitions,
			Object.fromEntries(this.account.partitions.map(partition => (
				[partition.partition_id, lastPeriod?.partitionPeriods[partition.partition_id]?.endingBalance || partition.balance]
			))),
		));
	}

	_postProcessTransaction(transaction: TransactionEvent, newEvent: AccumulatorEvent): void {
		const currentPeriod = peek(this.accountPeriods);
		if (currentPeriod && transaction.targetPartition) {
			currentPeriod.partitionPeriods[transaction.targetPartition].events.push(new AccumulatorEvent(
				transaction.date,
				transaction,
				currentPeriod.partitionPeriods[transaction.targetPartition].endingBalance,
			));
		}
	}

	doEndOfDayTrigger(dayDate: DelfiDate): TransactionEvent[] {
		if (!this.account.partitions) {
			return [];
		}
		const events = <TransactionEvent[]>[];
		for (const partition of this.account.partitions) {
			const partitionPeriod = peek(this.accountPeriods)?.partitionPeriods[partition.partition_id];
			if (
				partitionPeriod &&
				partition.target &&
				partition.transferSchedule &&
				this.nextPartitionTransfer[partition.partition_id]?.isSame(dayDate)
			) {
				if (partitionPeriod.endingBalance < partition.target) {
					const transferEvents = TransactionService.createEventsFromSchedule(dayDate, partition.transferSchedule);
					events.push(...transferEvents);
					this.nextPartitionTransfer[partition.partition_id] = TransactionService.getNextOccurrence(date(dayDate.add(1, 'day')), partition.transferSchedule.schedule);
				}
				else {
					this.nextPartitionTransfer[partition.partition_id] = undefined;
				}
			}
		}
		return events;
	};

	public createSummary(start: DelfiDate, end: DelfiDate): AccountSummary {
		return new AccountSummary(
			this.account,
			this.accountPeriods.filter(period => period.start.isSameOrBefore(end) && period.end.isSameOrAfter(start)),
		)
	}
}


export class AccountSummary {
	constructor(
		readonly account: Account,
		readonly accountPeriods: AccountPeriod[],
	) {}

	startingBalance(partition_id?): number {
		if (partition_id) {
			return this.accountPeriods[0]?.partitionPeriods[partition_id]?.startingBalance || 0;
		}
		return this.accountPeriods[0]?.totalPeriod?.startingBalance || 0;
	}

	endingBalance(partition_id?): number {
		if (partition_id) {
			return peek(this.accountPeriods)?.partitionPeriods[partition_id]?.endingBalance || 0;
		}
		return peek(this.accountPeriods)?.totalPeriod?.endingBalance || 0;
	}

	change(partition_id?): number {
		return this.endingBalance(partition_id) - this.startingBalance(partition_id);
	}
}
