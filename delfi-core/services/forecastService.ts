import { newDate } from "../utils/dateUtils";
import { type TransactionEvent, TransactionType, type TransactionSchedule } from "../models/transactions";
import { MonthSummary } from "../models/MonthSummary";
import TransactionService from "./transactionService";
import type { Account } from "../../delfi-core/models/Account";
import { ImmediateMatchTrigger } from "../../delfi-core/models/schedules/triggers";

export type Snapshot = {
	balances: Map<string, any>,
	event: TransactionEvent,
	date: string
}

type ForecastTransactionSchedule = TransactionSchedule & {
	dependentSchedules: TransactionSchedule[] // schedules with triggers matching this
}

export default class Forecast {
	initialAccounts: Map<string, Account>;
	transactionSchedules: ForecastTransactionSchedule[];

	constructor({
		accounts,
		transactionSchedules,
	}) {
		this.initialAccounts = accounts;
		this.transactionSchedules = transactionSchedules.map(t => ({
			...t,
			dependentSchedules: [],
		}));
		this.prepareImmediateTriggers();
	}

	private prepareImmediateTriggers() {
		// Check each schedule against each triggered schedule for dependencies
		for (let schedule of this.transactionSchedules) {
			schedule.dependentSchedules = [];

			for (let triggerSchedule of this.transactionSchedules) {
				// Skip if schedule is not an immediate match trigger
				if (triggerSchedule.trigger?.type !== 'immediateMatch') continue;

				const trigger = triggerSchedule.trigger as ImmediateMatchTrigger;
				// Check if schedule matches
				if (trigger.matchesSchedule(schedule)) {
					schedule.dependentSchedules.push(triggerSchedule);
				}
			}
		}
	}


	generateEvents(transactionSchedules, begin, end) {
        let now = newDate(begin)
        end = newDate(end);
		
		let events:TransactionEvent[] = [];
        for (let schedule of transactionSchedules) {
			if (schedule.schedule) {
				const scheduleEvents = TransactionService.generateEventsBetween(now,end,schedule);
				events.push(...scheduleEvents);
				for (let scheduleEvent of scheduleEvents) {
					for (let triggerSchedule of schedule.dependentSchedules) {
						events.push((<ImmediateMatchTrigger>triggerSchedule.trigger).createEventFromTrigger(triggerSchedule, scheduleEvent));
					}
				}
			}
        }
        events.sort((a,b)=>(a.date < b.date) ? -1 : ((a.date > b.date) ? 1 : 0));
		return events;
	}


    computeForecast(begin, end) {
        const events = this.generateEvents(this.transactionSchedules, begin, end);
    
        let accountsCopy = this.copyAccounts(this.initialAccounts);
		let snapshots: Snapshot[] = [];

		for (let event of events) {
            let eventDate = newDate(event.date);
            if (eventDate.isAfter(end)) break;

            accountsCopy = this.copyAccounts(accountsCopy)

            if (event.type === TransactionType.income) {
                let changedAccount = accountsCopy[event.targetAccount]
                changedAccount.balance += event.amount
            }

            if (event.type === TransactionType.expense) {
                let changedAccount = accountsCopy[event.targetAccount]
                changedAccount.balance -= event.amount
            }

            if (event.type === TransactionType.transfer) {
				if (!event.originAccount) {
					throw Error('Origin account not found')
				}
                let target = accountsCopy[event.targetAccount]
                let origin = accountsCopy[event.originAccount]
                target.balance += event.amount
                origin.balance -= event.amount
            }

			snapshots.push({
				date: eventDate.toISOString(),
				balances: this.copyAccounts(accountsCopy),
				event,
			})
        }
        return snapshots;
    }

    copyAccounts(accounts) {
        return JSON.parse(JSON.stringify(accounts));
    }
}
