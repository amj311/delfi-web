import type { TransactionEvent, PlannedTransaction } from "delfi-core/models/Transaction";
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

	public get endingBalance(): number {
		return peek(this.events)?.endingBalance || this.startingBalance;
	}

	public get change(): number {
		return this.endingBalance - this.startingBalance;
	}

	public onDayStart(start: DelfiDate, end: DelfiDate): AccumulatorPeriod {
		const newPeriod = new AccumulatorPeriod(start, end, this.endingBalance);
		this.periods.push(newPeriod);
		this._postCreatePeriod(newPeriod);
		return newPeriod;
	}
	
	private canProcessTransaction(transaction: TransactionEvent) {
		if (!this.periods.length) throw Error("Do not add event to accumulator with no periods");
		return FilterService.matches(this.filter, transaction);
	}

	public processNextTransaction(transaction: TransactionEvent): AccumulatorEvent | undefined {
		if (!this.canProcessTransaction(transaction)) return;
		const newEvent = new AccumulatorEvent(
			transaction.date,
			transaction,
			this.endingBalance
		);
		this.events.push(newEvent);
		this._postProcessTransaction(transaction, newEvent);
		peek(this.periods)?.events.push(newEvent);
		return newEvent;
	}


	// Overrides for Derived Classes
	protected _postCreatePeriod(newPeriod: AccumulatorPeriod) {};
	protected _postProcessTransaction(transaction: TransactionEvent, newEvent: AccumulatorEvent) {};

	// call after all other transactions for the day have been processed.
	// handles summary-type transactions based on period totals
	// Implementations can use this to do triggers at the end of any interval
	protected doEndOfDayTrigger(date: DelfiDate): TransactionEvent[] { return [] };
}
