import { v4 as uuid } from "uuid";

import { ScheduleService, type Schedule } from "./schedules/Schedule"
import { computeTriggeredAmount, type Trigger } from "./schedules/triggers"
import { date, toDelfiInterval, type DelfiDate } from "../utils/dateUtils";
import FilterService from "../services/FilterService";

export enum TransactionType {
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
	transactionType: TransactionType,
	target_account_id: string,
	target_account_partition_id: string | null,
	category_id: string,
	tagIds?: string[],
}


// PROBLEM: Projected budgets to deplete from a savings account, but real transactions to be made from a checking account.
// X SOLUTION 1: Don't make budgets account-specific. Let go of projecting the exact balance of each account, and only project the total balance.
// X SOLUTION 2: Do some kind of complicated allowance for real transactions from checking to 'under the hood' map to the savings account.
// ✅ SOLUTION 3: Don't worry about it too much. A real transaction can STILL be assigned to this budget even if did not come from the same account
// 				If funds are transferred from the savings account to finance the expense, the savings account balance will still have been depleted.

// PROBLEM: Budgets may change over time, but we want to keep track of the history of budgets. This is a critical improvement over other systems where you must either have only one budget always or make a new budget for every month.
// SOLUTION: A single budget, like income from an employer, is defined by a series of time-bound definitions.
// 				Each definition has a start and end date, and a budget amount. Do they need to specify more than just the amount? Maybe a description to differentiate them? Can the category change over time?
// 				The first and last don't need to specify a start or end date, respectively. The last one will be assumed to continue indefinitely or to the main budget's end date.
// 				Or, is the entire budget's start and end just defined by the first and last definitions? That would remove needing to verify them against eah other.
// 				- The UI will need to be very intuitive and make it easy to adjust the current and future budget definitions, but give a warning before editing past definitions. Past definitions may also be collapsed or hidden.
// 				What is a better name for these definitions? Budget periods? Budget windows? Budget variations?

type BudgetTransactionDetails = TransactionDetails & {
	budget_id: string,
	origin_account_id: string | null,
	origin_account_partition_id: string | null,
	notes?: string | null,
}

type ChildBudgetItem = BudgetTransactionDetails & {
	amount: number,
	date: DelfiDate,
}

export type ScheduledBudget = BudgetTransactionDetails & {
	recurrence_type: RecurrenceType.SCHEDULE,
	// ABOUT SCHEDULING
	// One-off transactions have schedules that start and end on the same date.
	// A "window" defines how long the budget is open for. If null, it is open to the next occurrence (?)
	// The window is defined by the a number of intervals of a certain length, i.e. 3 months or 4 weeks.
	// A repeating schedule determines the beginning of each new window.
	scheduleVariants: Array<{
		schedule: Schedule, // Schedule start and end dates define the variant's boundaries. Variants may not overlap.
		// Defines how long each budget occurrence is open for after it opens
		window?: {
			quantity: number,
			interval: 'day' | 'week' | 'month' | 'year',
		},
		// Defines how to project depletions across the window, i.e. a grocery trip every 2 weeks.
		// Especially for very large budgets, like yearly vacation and travel, which doesn't make sense to come out all at once
		projectionInterval?: {
			quantity: number,
			interval: 'day' | 'week' | 'month' | 'year',
		},
		amount: number,
	}>
	childItems?: Array<ChildBudgetItem>,
}

export type TriggeredBudget = BudgetTransactionDetails & {
	recurrence_type: RecurrenceType.TRIGGER,
	triggerVariants: Array<{
		start?: DelfiDate, // The date when this variant is active
		end?: DelfiDate, // The date when this variant is no longer active
		trigger: Trigger,
	}>
}

export type TransactionBudget = ScheduledBudget | TriggeredBudget;



// PROBLEM: A general yearly "Vacation" budget only applies to a broad category, but specifics aren't known. As we plan vacations each year, we need to start budgeting for specifics, but still not real transactions.
// SOLUTION: Children budget items! Children budget items do not recur, but are planned for a specific date or date range. They will apply to a specific occurrence of the parent budget.
// 				They do not ADD to the parent budget, but only add subdivisions to it.
// 				They can be grouped by the 'Group' feature (TODO)' like anywhere else
// 				This is also applies to the "Christmas Budget" example, where specific gifts can be planned ahead of time for a certain year's xmas budget
// 		Problem: Do parent budgets get assigned categories? Are children budgets limited to the parent's category?

export type BudgetOccurrence = {
	budget: TransactionBudget,
	start: DelfiDate,
	end: DelfiDate,
	events: BudgetEvent[],
}

export enum EventFlag {
	TRANSFER_COPY,
	SYSTEM_GENERATED,
}

type BaseBudgetEvent = TransactionDetails & {
	id: string,
	date: DelfiDate,
	year: number;
	month: number;
	day: number;
	amount: number,
	sourceBudget: TransactionBudget,
	flags: EventFlag[],
}

type PartialBudgetEvent = BaseBudgetEvent & {
	isPartial: true, // indicates that this event is a partial event, i.e. it is not the full amount of the budget
	budgetCap: number, // the total cap for the budget
	budgetSoFar: number, // the accumulation of this and previous events for the same window
}

type ScheduledBudgetEvent = PartialBudgetEvent | BaseBudgetEvent;

type TriggeredBudgetEvent = BaseBudgetEvent & {
	triggerEvent: BudgetEvent
}

export type BudgetEvent = ScheduledBudgetEvent | TriggeredBudgetEvent;


export default class TransactionService {
	static copyTransactionDetails(source: TransactionDetails): TransactionDetails {
		return {
			memo: source.memo,
			transactionType: source.transactionType,
			target_account_id: source.target_account_id,
			target_account_partition_id: source.target_account_partition_id,
			category_id: source.category_id,
			tagIds: source.tagIds,
		}
	}

	static getNextOccurrence(asOfDate: DelfiDate, schedule: Schedule): DelfiDate | undefined {
		return ScheduleService.getOccurrences(schedule, { start: asOfDate, take: 1 })[0];
	}

	static getPreviousOccurrence(asOfDate: DelfiDate, schedule: Schedule) {
		return ScheduleService.getOccurrences(schedule, { end: asOfDate, take: 1, reverse: true })[0];
	}

	static createOccurrencesFromSchedule(start: DelfiDate, end: DelfiDate, schedule: ScheduledBudget): BudgetOccurrence[] {
		const occurrences: BudgetOccurrence[] = [];
		for (const variant of schedule.scheduleVariants) {
			const recurrenceDates = ScheduleService.getOccurrences(variant.schedule, { start, end });

			const computeProjectionEvents = function(windowStart: DelfiDate, windowEnd: DelfiDate): PartialBudgetEvent[] {
				const intervalQty = variant.projectionInterval!.quantity;
				const interval = variant.projectionInterval!.interval;
				const projectionEvents: PartialBudgetEvent[] = [];
				// Get child items within this window
				const childItems = schedule.childItems?.filter(item => date(item.date).isBetween(windowStart, windowEnd)) || [];

				let budgetSoFar = 0;
				// Process child items into events
				for (const child of childItems) {
					const childEvents = TransactionService.createDateEventsFromBudgetDetails(date(child.date), child, child.amount) as PartialBudgetEvent[];
					childEvents.forEach(event => {
						event.isPartial = true;
						event.budgetCap = variant.amount;
						event.budgetSoFar = budgetSoFar + child.amount;
						budgetSoFar += child.amount;
					});
					projectionEvents.push(...childEvents);
				}

				// If children exceed or equal the budget, do not create projection events
				// Calculate how many intervals fit between windowStart and windowEnd
				const totalIntervals = Math.floor(windowEnd.diff(windowStart, interval, true) / intervalQty);

				if (budgetSoFar < variant.amount && totalIntervals > 0) {
					// Remaining amount for projections
					const remainingAmount = variant.amount - budgetSoFar;
					const eventAmount = remainingAmount / totalIntervals;

					for (let i = 0; i < totalIntervals; i++) {
						const intervalDate = date(windowStart.add(i * intervalQty, interval));
						budgetSoFar += eventAmount;
						projectionEvents.push(...TransactionService.createDateEventsFromBudgetDetails(intervalDate, schedule, eventAmount).map(event => ({
							...event,
							isPartial: true as true,
							budgetCap: variant.amount,
							budgetSoFar: budgetSoFar + 0,
						})));
					}
				}

				return projectionEvents;
			}

			if (variant.projectionInterval) {
				// Handle the possibility that the requested start date is in the middle of an ongoing window.
				const currentOccurrence = TransactionService.getPreviousOccurrence(start, variant.schedule);
				if (currentOccurrence && !currentOccurrence.isSame(recurrenceDates[0], 'day')) {
					// Generate events that haven't happened yet
					const occurrenceEnd = TransactionService.getBudgetOccurrenceEndDate(variant, currentOccurrence);
					const currentOccurrenceEvents = computeProjectionEvents(currentOccurrence, occurrenceEnd);
					const futureEvents = currentOccurrenceEvents.filter(event => event.date.isAfter(start));
					occurrences.push({
						budget: schedule,
						start: currentOccurrence,
						end: occurrenceEnd,
						events: futureEvents,
					});
				}
			}

			occurrences.push(...recurrenceDates.map((startDate) => {
				const occurrence: BudgetOccurrence = {
					budget: schedule,
					start: startDate,
					end: TransactionService.getBudgetOccurrenceEndDate(variant, startDate),
					events: [],
				}

				if (!variant.projectionInterval) {
					// handle non-windowed schedules right off the bat, just use the cap amount
					const hereEvents = TransactionService.createDateEventsFromBudgetDetails(startDate, schedule, variant.amount) as BaseBudgetEvent[];
					occurrence.events.push(...hereEvents);
				}
				else {
					// For windowed schedules, compute the interval events
					occurrence.events.push(...computeProjectionEvents(startDate, occurrence.end));
				}

				return occurrence;
			}));
		}

		return occurrences;
	}

	private static getBudgetOccurrenceEndDate(variant: ScheduledBudget['scheduleVariants'][number], occurrenceStart: DelfiDate): DelfiDate {
		return occurrenceStart.add(variant.schedule.interval || 1, toDelfiInterval(variant.schedule.frequency)).subtract(1, 'day'); // Subtract one day to get the end of the occurrence, not the start of the next one
	}

	// TODO support triggering budgets based on REAL transactions?
	static createOccurrenceFromTrigger(transactionDate: DelfiDate, budget: TriggeredBudget, triggerEvent: BudgetEvent): BudgetOccurrence | undefined {
		for (const variant of budget.triggerVariants) {
			if (!transactionDate.isBetweenInclusive(variant.start || date(transactionDate.subtract(999, 'year')), variant.end || date(transactionDate.add(999, 'year')))) {
				// If the transaction date is not within the variant's active period, skip it
				continue;
			}
			if (!FilterService.matches(variant.trigger.filter, triggerEvent)) {
				// If the trigger event does not match the variant's filter, skip it
				continue;
			}
			const amount = computeTriggeredAmount(triggerEvent.amount, variant.trigger.computation);
			const events = TransactionService.createDateEventsFromBudgetDetails(transactionDate, budget, amount) as TriggeredBudgetEvent[];
			events.forEach(event => {
				event.triggerEvent = triggerEvent;
			});
			return {
				budget,
				start: transactionDate,
				end: transactionDate,
				events,
			};
		}
	}

	private static createDateEventsFromBudgetDetails(eventDate: DelfiDate, budget: BudgetTransactionDetails, amount: number): BaseBudgetEvent[] {
		const resolvedAmount = TransactionService.resolveScheduleAmount(budget, amount);
		const base = {
			...TransactionService.copyTransactionDetails(budget),
			id: uuid(),
			date: eventDate,
			year: eventDate.year(),
			month: eventDate.month(),
			day: eventDate.day(),
			sourceBudget: budget as TransactionBudget,
		}
		const events: BaseBudgetEvent[] = [];
		// Origin transaction for Transfer
		if (budget.transactionType === TransactionType.TRANSFER && budget.origin_account_id) {
			// TODO don't allow transfers without origin account
			events.push({
				...base,
				amount: -resolvedAmount,
				target_account_id: budget.origin_account_id,
				target_account_partition_id: budget.origin_account_partition_id,
				flags: [EventFlag.TRANSFER_COPY],
			});
		}

		// Standard 1:1 schedule, or target for transfer
		events.push({
			...base,
			amount: resolvedAmount,
			id: uuid(),
			flags: [],
		});
		return events;
	}

	static resolveScheduleAmount(schedule: BudgetTransactionDetails, amount: number): number {
		if (schedule.transactionType === TransactionType.DEBIT) {
			return -amount;
		}
		return amount;
	}
}
