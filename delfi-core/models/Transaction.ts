import { v4 as uuid } from "uuid";

import { ScheduleService, type Schedule } from "./schedules/Schedule"
import { ImmediateMatchTrigger, type Trigger } from "./schedules/triggers"
import { date, type DelfiDate } from "../utils/dateUtils";
import FilterService from "../services/FilterService";

type Replace<T1, T2> = Omit<T1, keyof T2> & T2;
type Maybe<T> = T | null;

export enum PlannedTransactionType {
	CREDIT = "CREDIT",
	DEBIT = "DEBIT",
	TRANSFER = "TRANSFER",
}

export enum RecurrenceType {
	SCHEDULE = "SCHEDULE",
	TRIGGER = "TRIGGER",
}

export type TransactionDetails = {
	memo: string,
	type: PlannedTransactionType,
	target_account_id: string,
	target_account_partition_id: string | null,
	category_id: string,
	tagIds?: string[],
}

type PlannedTransactionDetails = TransactionDetails & {
	id: string,
	origin_account_id: string | null,
	origin_account_partition_id: string | null,
	recurrence_type: RecurrenceType,
}

export type PlannedTransaction = PlannedTransactionDetails & {
	schedule?: Maybe<Schedule>,
	amount: number,
	trigger: Maybe<Trigger>,
}

export type TransactionSchedule = Replace<PlannedTransaction, {
	schedule: Schedule,
	amount: number,
	trigger: undefined,
}>

export type TransactionTrigger = Replace<PlannedTransaction, {
	trigger: Trigger,
	amount?: number,
}>

export enum EventFlag {
	TRANSFER_COPY,
	SYSTEM_GENERATED,
}

export type TransactionEvent = TransactionDetails & {
	id: string,
	date: DelfiDate,
	amount: number,
	sourceSchedule?: TransactionSchedule,
	sourceTrigger?: TransactionTrigger,
	triggerEvent?: TransactionEvent
	budgetId?: string
	flags: EventFlag[],
}


export default class TransactionService {
	static copyTransactionDetails(source: TransactionDetails): TransactionDetails {
		return {
			memo: source.memo,
			type: source.type,
			target_account_id: source.target_account_id,
			target_account_partition_id: source.target_account_partition_id,
			category_id: source.category_id,
			tagIds: source.tagIds,
		}
	}

	static generateScheduledDates(transactionSchedules: TransactionSchedule[], start, end): {
		date: DelfiDate,
		schedule: TransactionSchedule
	}[] {
		let events = <any[]>[];
        for (let schedule of transactionSchedules) {
			if (schedule.schedule) {
				if (!schedule.schedule) throw Error('Transaction schedule has no schedule. Is this a trigger instead?');
        		let dates = ScheduleService.getOccurrences(schedule.schedule, { start, end }).map((d:DelfiDate) => ({
					date: date(d),
					schedule: schedule
				}));
				events.push(...dates);
			}
        }
        events.sort((a,b)=>(a.date < b.date) ? -1 : ((a.date > b.date) ? 1 : 0));
		return events;
	}

	static getNextOccurrence(asOfDate: DelfiDate, schedule: Schedule): DelfiDate | undefined {
		return ScheduleService.getOccurrences(schedule, { start: asOfDate, take: 1 })[0];
	}

	static getPreviousOccurrence(asOfDate: DelfiDate, schedule: Schedule) {
		return ScheduleService.getOccurrences(schedule, { end: asOfDate, take: 1, reverse: true })[0];
	}

	static createEventsFromSchedule(date: DelfiDate, schedule: TransactionSchedule): TransactionEvent[] {
		const events: TransactionEvent[] = [];
		// Origin transaction for Transfer
		if (schedule.type === PlannedTransactionType.TRANSFER && schedule.origin_account_id) {
			// TODO don't allow transfers without origin account
			events.push({
				...TransactionService.copyTransactionDetails(schedule),
				amount: -schedule.amount,
				target_account_id: schedule.origin_account_id,
				target_account_partition_id: schedule.origin_account_partition_id,
				id: uuid(),
				date,
				sourceSchedule: schedule,
				flags: [EventFlag.TRANSFER_COPY],
			});
		}

		// Standard 1:1 schedule, or target for transfer
		events.push({
			...TransactionService.copyTransactionDetails(schedule),
			amount: TransactionService.resolveScheduleAmount(schedule, schedule.amount),
			id: uuid(),
			date,
			sourceSchedule: schedule,
			flags: [],
		});
		return events;
	}

	static createEventsFromTrigger(date: DelfiDate, transactionTrigger: TransactionTrigger, triggerEvent: TransactionEvent): TransactionEvent[] {
		const trigger = new ImmediateMatchTrigger(transactionTrigger.trigger as ImmediateMatchTrigger);
		if (FilterService.matches(trigger.filter, triggerEvent)) {
			const events: TransactionEvent[] = [];
			// Origin transaction for Transfer
			if (transactionTrigger.type === PlannedTransactionType.TRANSFER && transactionTrigger.origin_account_id) {
				// TODO don't allow transfers without origin account
				events.push({
					...TransactionService.copyTransactionDetails(transactionTrigger),
					amount: -trigger.computeAmount(triggerEvent.amount),
					target_account_id: transactionTrigger.origin_account_id,
					target_account_partition_id: transactionTrigger.origin_account_partition_id,
					id: uuid(),
					date,
					sourceTrigger: transactionTrigger,
					flags: [EventFlag.TRANSFER_COPY],
				});
			}

			// Standard 1:1 schedule, or target for transfer
			events.push({
				...TransactionService.copyTransactionDetails(transactionTrigger),
				id: uuid(),
				date,
				sourceTrigger: transactionTrigger,
				triggerEvent: triggerEvent,
				amount: TransactionService.resolveScheduleAmount(transactionTrigger, trigger.computeAmount(triggerEvent.amount)),
				flags: [],
			})
			return events;
		}
		return [];
	}

	static resolveScheduleAmount(schedule: PlannedTransactionDetails, amount: number): number {
		if (schedule.type === PlannedTransactionType.DEBIT) {
			return -amount;
		}
		return amount;
	}
}
