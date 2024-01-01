import type { TransactionEvent } from "delfi-core/services/transactionService";
import type { TransactionFilter } from "../services/FilterService";
import FilterService from "../services/FilterService";
import { date, type DelfiDate } from "../utils/dateUtils";
import { peek } from "../utils/miscUtils";

export class AccumulatorPeriod {
	constructor (
		readonly start: DelfiDate,
		readonly end: DelfiDate,
		readonly startingBalance: number,
		readonly events: AccumulatorEvent[] = [],
	) {}

	get endingBalance(): number {
		return peek(this.events)?.endingBalance || this.startingBalance;
	}

	get change(): number {
		return this.endingBalance - this.startingBalance;
	}
}

export class AccumulatorEvent {
	constructor (
		readonly date: DelfiDate,
		readonly transaction: TransactionEvent,
		readonly startingBalance: number,
	) {}

	get endingBalance() {
		return this.startingBalance + this.transaction.amount;
	}

	get change() {
		return this.transaction.amount;
	}
}

export default class Accumulator {
	constructor (
		readonly key: string,
		readonly startingBalance: number,
		readonly filter: TransactionFilter,
		readonly events: AccumulatorEvent[] = [],
		readonly periods: AccumulatorPeriod[] = [],
	) {}

	public createNewPeriod(start: DelfiDate, end: DelfiDate): AccumulatorPeriod {
		const newPeriod = new AccumulatorPeriod(start, end, this.endingBalance);
		this.periods.push(newPeriod);
		return newPeriod;
	}
	
	public processNextTransaction(transaction: TransactionEvent): AccumulatorEvent | undefined {
		if (!this.periods.length) throw Error("Do not add event to accumulator with no periods");
		if (!FilterService.matches(this.filter, transaction)) return;
		const newEvent = new AccumulatorEvent(
			transaction.date,
			transaction,
			this.endingBalance
		);
		this.events.push(newEvent);
		peek(this.periods)?.events.push(newEvent);
		return newEvent;
	}

	get endingBalance(): number {
		return peek(this.events)?.endingBalance || this.startingBalance;
	}

	get change(): number {
		return this.endingBalance - this.startingBalance;
	}
}
