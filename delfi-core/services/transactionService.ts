import { v4 as uuid } from "uuid";

import type { Schedule } from "../models/schedules/Schedule"
import { ImmediateMatchTrigger, type Trigger } from "../models/schedules/triggers"
import { date, type DelfiDate } from "../utils/dateUtils";
import FilterService from "./FilterService";

export enum TransactionScheduleType {
	"income" = "income",
	"expense" = "expense",
	"transfer" = "transfer"
}

export type TransactionDetails = {
	memo: string,
	type: TransactionScheduleType,
	targetAccount: string,
	categoryId?: string,
	tagIds?: string[],
}

type PlannedTransactionDetails = TransactionDetails & {
	id: string,
	originAccount?: string,
	recurrenceType: 'schedule' | 'trigger',
}

export type TransactionSchedule = PlannedTransactionDetails & {
	schedule: Schedule,
	amount: number,
}

export type TransactionTrigger = PlannedTransactionDetails & {
	trigger: Trigger,
	amount?: number,
}

export type TransactionEvent = TransactionDetails & {
	id: string,
	date: DelfiDate,
	amount: number,
	sourceSchedule?: TransactionSchedule,
	sourceTrigger?: TransactionTrigger,
	triggerEvent?: TransactionEvent
	budgetId?: string
}


export default class TransactionService {
	static copyTransactionDetails(source: TransactionDetails): TransactionDetails {
		return {
			memo: source.memo,
			type: source.type,
			targetAccount: source.targetAccount,
			categoryId: source.categoryId,
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
        		let dates = schedule.schedule.getOccurrencesBetween(start, end).map((d:DelfiDate) => ({
					date: date(d),
					schedule: schedule
				}));
				events.push(...dates);
			}
        }
        events.sort((a,b)=>(a.date < b.date) ? -1 : ((a.date > b.date) ? 1 : 0));
		return events;
	}

	static createEventsFromSchedule(date: DelfiDate, schedule: TransactionSchedule): TransactionEvent[] {
		const events: TransactionEvent[] = [];
		// Origin transaction for Transfer
		if (schedule.type === TransactionScheduleType.transfer && schedule.originAccount) {
			// TODO don't allow transfers without origin account
			events.push({
				...TransactionService.copyTransactionDetails(schedule),
				amount: -schedule.amount,
				targetAccount: schedule.originAccount,
				id: uuid(),
				date,
				sourceSchedule: schedule,
			});
		}

		// Standard 1:1 schedule, or target for transfer
		events.push({
			...TransactionService.copyTransactionDetails(schedule),
			amount: TransactionService.resolveScheduleAmount(schedule, schedule.amount),
			id: uuid(),
			date,
			sourceSchedule: schedule,
		});
		return events;
	}

	static createEventsFromTrigger(date: DelfiDate, transactionTrigger: TransactionTrigger, triggerEvent: TransactionEvent): TransactionEvent[] {
		const trigger = new ImmediateMatchTrigger(transactionTrigger.trigger as ImmediateMatchTrigger);
		if (FilterService.matches(trigger.filter, triggerEvent)) {
			const events: TransactionEvent[] = [];
			// Origin transaction for Transfer
			if (transactionTrigger.type === TransactionScheduleType.transfer && transactionTrigger.originAccount) {
				// TODO don't allow transfers without origin account
				events.push({
					...TransactionService.copyTransactionDetails(transactionTrigger),
					amount: -trigger.computeAmount(triggerEvent.amount),
					targetAccount: transactionTrigger.originAccount,
					id: uuid(),
					date,
					sourceTrigger: transactionTrigger,
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
			})
			return events;
		}
		return [];
	}

	static resolveScheduleAmount(schedule: PlannedTransactionDetails, amount: number): number {
		if (schedule.type === TransactionScheduleType.expense) {
			return -amount;
		}
		return amount;
	}
}
