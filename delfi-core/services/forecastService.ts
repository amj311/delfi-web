import { newDate } from "../utils/dateUtils";
import { type TransactionEvent, TransactionType, type TransactionSchedule } from "../models/transactions";
import { MonthSummary } from "../models/MonthSummary";
import TransactionService from "./transactionService";
import type { Account } from "../../delfi-core/models/Account";
import { ImmediateMatchTrigger } from "../../delfi-core/models/schedules/triggers";
import dayjs from "dayjs";

export type Snapshot = {
	balances: { [key: string]: Account },
	event: TransactionEvent,
	date: string
}

type ForecastTransactionSchedule = TransactionSchedule & {
	dependentSchedules: TransactionSchedule[] // schedules with triggers matching this
}

export default class Forecast {
	initialAccounts: Map<string, Account>;
	transactionSchedules: ForecastTransactionSchedule[];
	snapshots: Snapshot[] = [];

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
		this.snapshots = snapshots;
        return snapshots;
    }

    copyAccounts(accounts) {
        return JSON.parse(JSON.stringify(accounts));
    }

	public getTimeline(start, end, interval: 'day' = 'day') {
		const points: {
			start: string,
			end: string,
			startingBalances?: { [key: string]: Account },
			endingBalances?: { [key: string]: Account },
			snapshots: Snapshot[],
		}[] = [];

		let intervalBegin = dayjs(start).startOf('day');
		let intervalEnd = intervalBegin.add(1, interval).subtract(1, 'ms');

		// create one point for every 
		const advancePoint = () => {
			const lastPoint = points[points.length - 1];
			// handle moving from previous point
			if (lastPoint) {
				lastPoint.endingBalances = lastPoint.snapshots[lastPoint.snapshots.length - 1]?.balances || lastPoint.startingBalances;
				intervalBegin = intervalBegin.add(1, interval);
				intervalEnd = intervalEnd.add(1, interval);
			}
			// create new point
			const newPoint = {
				start: intervalBegin.toISOString(),
				end: intervalEnd.toISOString(),
				startingBalances: lastPoint?.endingBalances || undefined,
				endingBalances: undefined,
				snapshots: <Snapshot[]>[],
			};
			points.push(newPoint);
			return newPoint;
		};



		let currentPoint = advancePoint();
		let snapshotIndex = 0;
		let snap = this.snapshots[snapshotIndex];

		while (intervalBegin.isBefore(end)) {
			// gather snapshots for this interval
			while (snapshotIndex < this.snapshots.length) {
				snap = this.snapshots[snapshotIndex];
				if (dayjs(snap.date) < intervalBegin || dayjs(snap.date) > intervalEnd) {
					break;
				}
				if (dayjs(snap.date) > end) {
					// don't add snapshot but keep creating points
					break;
				}
	
				// Get starting balance for first point
				if (!currentPoint.startingBalances) {
					if (snapshotIndex === 0) {
						// use initial balances if this is the first snapshot
						currentPoint.startingBalances = this.copyAccounts(this.initialAccounts);
					}
					else {
						// get initial from the previous snapshot
						currentPoint.startingBalances = this.copyAccounts(this.snapshots[snapshotIndex - 1].balances);
					}
				}


				currentPoint.snapshots.push(snap);
				snapshotIndex++;
			}
			
			currentPoint = advancePoint();
		}

		// The loop breaks when the last point is out of the range, so pop it
		points.pop();
		return points;
	}
}
