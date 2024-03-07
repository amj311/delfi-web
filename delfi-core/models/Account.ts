import Accumulator, { AccumulatorEvent, AccumulatorPeriod } from "./Accumulator"
import TransactionService, { type PlannedTransaction, type TransactionEvent, type TransactionSchedule } from "./Transaction"
import { date, type DelfiDate } from "../utils/dateUtils"
import { peek } from "../../delfi-core/utils/miscUtils"

type SavingsGoal  = {
	target_balance: number,
	target_date?: Date,
	schedule_details?: TransactionSchedule,
}

export type AccountPartition = {
	account_partition_id: string,
	name: string,
	current_balance: number,
	savings_goal?: SavingsGoal,
}

export type Account = {
	account_id: string,
	current_balance: number,
	partitions: AccountPartition[],
	savings_goal?: SavingsGoal,
}


export class BaseSavingsAccumulator extends Accumulator {
	private nextSavingsTransfer: DelfiDate | undefined;

	constructor(
		readonly entityId: string,
		readonly start: DelfiDate,
		readonly startingBalance: number,
		readonly filter,
		readonly savings_goal?: SavingsGoal,
		readonly partitionId?: string,
	) {
		super(
			entityId,
			startingBalance,
			filter,
		);
		// Get first next transfer date
		if (this.savings_goal && this.savings_goal.schedule_details) {
			this.savings_goal.schedule_details.target_account_partition_id = partitionId || null;
			this.nextSavingsTransfer = TransactionService.getNextOccurrence(start, this.savings_goal.schedule_details.schedule);
			console.log("creating first transfer event", this.nextSavingsTransfer?.toString())
		}
	}

	processSavingsOnDate(dayDate: DelfiDate): TransactionEvent[] {
		if (dayDate.toString() === '2024-03-25') {
			console.log("processSavingsOnDate", dayDate.toString(), this.nextSavingsTransfer?.toString())
		}
		if (!this.savings_goal || !this.nextSavingsTransfer) {
			return [];
		}
		else if (this.nextSavingsTransfer?.isSame(dayDate) && this.endingBalance < this.savings_goal.target_balance) {
			const transferEvents = TransactionService.createEventsFromSchedule(dayDate, this.savings_goal.schedule_details as TransactionSchedule);
			console.log(transferEvents)
			this.nextSavingsTransfer = TransactionService.getNextOccurrence(date(dayDate.add(1, 'day')), this.savings_goal.schedule_details.schedule);
			return transferEvents;
		}
		return [];
	}
}

export class AccountAccumulator extends BaseSavingsAccumulator {
	partitionAccumulators: { [key: string]: BaseSavingsAccumulator } = {};

	constructor(
		readonly account: Account,
		readonly start: DelfiDate,
		readonly startingBalance: number = account.current_balance,
	) {
		super(
			account.account_id,
			start,
			startingBalance,
			[{
				property: 'target_account_id',
				operator: 'eq',
				operand: account.account_id,
			}],
			account.savings_goal
		);
		this.partitionAccumulators = Object.fromEntries(account.partitions.map(partition => (
			[
				partition.account_partition_id,
				new BaseSavingsAccumulator(
					partition.account_partition_id,
					start,
					partition.current_balance,
					[{
						property: 'target_account_partition_id',
						operator: 'eq',
						operand: partition.account_partition_id,
					}],
					partition.savings_goal,
					partition.account_partition_id
				),
			]
		)));
	}

	// let children create periods
	protected _postCreatePeriod(newPeriod: AccumulatorPeriod): void {
		for (const partition of this.account.partitions) {
			this.partitionAccumulators[partition.account_partition_id].onDayStart(newPeriod.start, newPeriod.end);
		}
	}

	// let children process transactions
	protected _postProcessTransaction(transaction: TransactionEvent, newEvent: AccumulatorEvent): void {
		if (transaction.memo === "New Car Savings") {
			console.log("from savings goal", transaction)
			console.log(peek(this.events))
		}
		for (const partition of this.account.partitions) {
			this.partitionAccumulators[partition.account_partition_id].processNextTransaction(transaction);
		}
	}

	protected doEndOfDayTrigger(dayDate: DelfiDate): TransactionEvent[] {
		// console.log("ACCOUNT ACCUMULATOR")
		const events = <TransactionEvent[]>[];
		events.push(...super.processSavingsOnDate(dayDate));
		for (const partition of this.account.partitions) {
			// console.log(this.partitionAccumulators[partition.account_partition_id])
			events.push(...this.partitionAccumulators[partition.account_partition_id].processSavingsOnDate(dayDate));
		}
		return events;
	};

	public createSummary(start: DelfiDate, end: DelfiDate): AccountPeriodSummary {
		return new AccountPeriodSummary(start, end, this);
	}
}


export class AccountPeriodSummary extends AccumulatorPeriod {
	partitionSummaries = new Map<string, AccumulatorPeriod>();
	account!: Account;

	constructor(
		readonly start: DelfiDate,
		readonly end: DelfiDate,
		readonly accountAccumulator: AccountAccumulator,
	) {
		const events = accountAccumulator.events.filter(event => event.date.isSameOrAfter(start) && event.date.isSameOrBefore(end));
		super(
			start,
			end,
			events[0]?.startingBalance || accountAccumulator.startingBalance,
			events,
		);
		this.account = accountAccumulator.account;
		Object.values(this.accountAccumulator.partitionAccumulators).forEach(child => {
			const events = child.events.filter(event => event.date.isSameOrAfter(start) && event.date.isSameOrBefore(end));
			this.partitionSummaries.set(child.entityId, new AccumulatorPeriod(
				this.start,
				this.end,
				events[0]?.startingBalance || child.startingBalance,
				events,
			));
		});
	}
}

