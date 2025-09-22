import { ScheduleService, type SingleSchedule } from "./schedules/Schedule"
import { computeTriggeredAmount, type Trigger } from "./schedules/triggers"
import { ddate, toDelfiInterval, type DelfiDate } from "../utils/dateUtils";
import FilterUtils from "./Filters";
import { type BudgetableTransactionDetails } from "./Transaction";
import type { CommonEvent } from "./Summary";
import { v4 as uuid } from "uuid";
import type { MONTHS } from "delfi-core/utils/constants";
import type { Replace } from "delfi-core/utils/typeUtils";

export enum RecurrenceType {
	SCHEDULE = "SCHEDULE",
	TRIGGER = "TRIGGER",
}

export enum BudgetType {
	TRANSACTION = "TRANSACTION",
	TRANSFER = "TRANSFER",
}

export type BudgetedTransactionDetails = BudgetableTransactionDetails & {
	memo: string,
	budgetType: BudgetType,
	notes?: string | null,
	origin_account_id?: string, // The account from which the transaction is made (for transfers)
	origin_account_partition_id?: string, // The partition from which the transaction is made (for transfers)
}

// type TransactionBudgetDetails = Omit<BaseBudgetedTransactionDetails, 'origin_account_id' | 'origin_account_partition_id'> & {
// 	budgetType: BudgetType.TRANSACTION,
// }

// type TransferBudgetDetails = BaseBudgetedTransactionDetails & Required<{
// 	budgetType: BudgetType.TRANSFER,
// 	origin_account_id: string, // The account from which the transfer is made
// 	origin_account_partition_id: string, // The partition from which the transfer is made
// }>

// export type BudgetedTransactionDetails = TransactionBudgetDetails | TransferBudgetDetails;

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

// ABOUT AMOUNTS
// There are different ways to to define the amount of a budget:
// 1. Fixed amount - the budget has a fixed amount for the entire period, i.e. a monthly budget of $1000
// 2. Triggered amount - the budget amount is determined by other budgets or transactions, i.e. a percentage of your income
// 3. Seasonal amount - Only available for monthly budgets, a different amount can be set for each month. I.e. a heating bill that is higher in winter and lower in summer.

export type FixedAmount = {
	type: 'fixed',
	amount: number, // The fixed amount for the budget
}
export type TriggeredAmount = {
	type: 'triggered',
	trigger: Trigger, // The trigger that determines the amount
};
export type SeasonalAmount = {
	type: 'seasonal',
	monthAmounts: Record<MONTHS, number>, // A map of month names to amounts, i.e. { January: 1000, February: 800, ... }
}

export type BudgetAmountTemplate = FixedAmount | TriggeredAmount | SeasonalAmount;

type BudgetOccurrenceSchedule = Pick<SingleSchedule, 'start' | 'end' | 'frequency' | 'interval'>;

/** Used to compute the projected dates within a budget occurrence */
type BudgetProjectionSchedule = Pick<SingleSchedule, 'byMonthOfYear' | 'byDayOfMonth' | 'byDayOfWeek' | 'interval' | 'frequency'>;

type ScheduleVariant = {
	schedule_variant_id?: string, // Unique ID for the variant
	schedule: BudgetOccurrenceSchedule, // Schedule start and end dates define the variant's boundaries. Variants may not overlap.
	/** If missing, budget will be projected on start date */
	projectionSchedule?: BudgetProjectionSchedule,
	amountTemplate: BudgetAmountTemplate, // TODO: support variable amounts, like a heating bill
	// // Defines how long each budget occurrence is open for after it opens
	// // TODO I don't actually compute this yet
	// window?: {
	// 	quantity: number,
	// 	interval: 'day' | 'week' | 'month' | 'year',
	// },
}
type TriggeredSchedule = Replace<ScheduleVariant, {
	amountTemplate: TriggeredAmount, // The amount is determined by the trigger
}>

export type Budget = BudgetedTransactionDetails & {
	budget_id: string,
	recurrence_type: RecurrenceType,
	// ABOUT SCHEDULING
	// One-off transactions have schedules that start and end on the same date.
	// !!!! THIS WOULD COMPLICATE assigning real transactions to them. Perhaps the occurrence gives a whole range in which the budget applies,
	// !!!! but the projection rules determine when we expect the one-off transaction to happen....?
	// A "window" defines how long the budget is open for. If null, it is open to the next occurrence (?)
	// The window is defined by the a number of intervals of a certain length, i.e. 3 months or 4 weeks.
	// A repeating schedule determines the beginning of each new window.
	scheduleVariants: Array<ScheduleVariant>,
	childItems?: Array<BudgetChildItem>,
	/** If true, this budget is considered complete after its first attribution. Alternatively, check projection rules for a single date...? */
	onceAndDone?: boolean,
}

export type ScheduledBudget = Budget & {
	recurrence_type: RecurrenceType.SCHEDULE,
}

export type TriggeredBudget = Replace<Budget, {
	recurrence_type: RecurrenceType.TRIGGER,
	scheduleVariants: Array<TriggeredSchedule>, // Triggered budgets have a single schedule variant that defines the trigger
}>


// PROBLEM: A general yearly "Vacation" budget only applies to a broad category, but specifics aren't known. As we plan vacations each year, we need to start budgeting for specifics, but still not real transactions.
// SOLUTION: Children budget items! Children budget items do not recur, but are planned for a specific date or date range. They will apply to a specific occurrence of the parent budget.
// 				They do not ADD to the parent budget, but only add subdivisions to it.
// 				They can be grouped by the 'Group' feature (TODO)' like anywhere else
// 				This is also applies to the "Christmas Budget" example, where specific gifts can be planned ahead of time for a certain year's xmas budget
// 		Problem: Do parent budgets get assigned categories? Are children budgets limited to the parent's category?

export type BudgetChildItem = BudgetedTransactionDetails & {
	budget_child_item_id: string, // Unique ID for the child item
	amount: number, // A fixed amount for a single point in time!
	date: DelfiDate,
}


export type BudgetOccurrenceDraft = {
	/** NOT PERSISTENT. This ID is generated every time the forecast is computed. */
	occurrence_id: string,
	budget: Budget,
	start: DelfiDate,
	end: DelfiDate,
	sourceSchedule: ScheduleVariant,
}

export type BudgetOccurrence = BudgetOccurrenceDraft & {
	amount: number, // The total amount of the budget for this occurrence
	budgetEvents: ProjectionEvent[],
}

export type ProjectionEventDetails = BudgetedTransactionDetails & {
	budget_event_id: string,
	sourceOccurrence: BudgetOccurrence, // The occurrence this event is associated with
	triggerEvent?: ProjectionEvent
	isTransferCopy?: boolean, // If true, this event is a copy of a transfer event, i.e. the target of a transfer
	isPartial?: true, // indicates that this event is a partial event, i.e. it is not the full amount of the budget
	budgetCap?: number, // the total cap for the budget
	budgetUsedSoFar?: number, // the accumulation of this and previous events for the same window
}

export type ProjectionEvent = Replace<CommonEvent, {
	Budget: Budget,
	projectionDetails: ProjectionEventDetails,
	attributionDetails: undefined,
}>

export default class BudgetUtils {
	static createScheduledOccurrences(start: DelfiDate, end: DelfiDate, budget: ScheduledBudget): BudgetOccurrence[] {
		const occurrences: BudgetOccurrence[] = [];
		for (const variant of budget.scheduleVariants) {
			const recurrenceDates = BudgetUtils.getBudgetOccurrences(variant.schedule, start, end); // include ongoing occurrences
			occurrences.push(...recurrenceDates.map(({ start: startDate, end: endDate }) => {
				const occurrence: BudgetOccurrence = {
					occurrence_id: BudgetUtils.createOccurrenceId(budget, startDate, endDate),
					budget: budget,
					start: startDate,
					end: endDate,
					sourceSchedule: variant,
					amount: 0,
					budgetEvents: [],
				}
				const amount = BudgetUtils.getScheduledOccurrenceAmount(occurrence);
				return {
					...occurrence,
					amount,
					budgetEvents: BudgetUtils.computeProjectionEvents(amount, occurrence.start, occurrence.end, occurrence),
				};
			}));
		}

		return occurrences;
	}

	static getScheduledOccurrenceAmount(occurrenceDraft: BudgetOccurrenceDraft): number {
		if (occurrenceDraft.sourceSchedule.amountTemplate.type === 'fixed') {
			return occurrenceDraft.sourceSchedule.amountTemplate.amount;
		}
		else if (occurrenceDraft.sourceSchedule.amountTemplate.type === 'seasonal') {
			return occurrenceDraft.sourceSchedule.amountTemplate.monthAmounts[occurrenceDraft.start.month()];
		}
		throw new Error(`Can't get scheduled amount for amountTemplate type: ${occurrenceDraft.sourceSchedule.amountTemplate}`);
	}

	/**
	 * Computes all occurrences for a given schedule within a time window.
	 * NOTE: occurrences are locked to the beginning and end of their interval! Beginning of week, or month, or year.
	 * Other properties will be used for the exact dates of projections.
	 * @param schedule 
	 */
	static getBudgetOccurrences(schedule: BudgetOccurrenceSchedule, start: DelfiDate, end: DelfiDate): Array<{ start: DelfiDate, end: DelfiDate }> {
		const occurrenceSchedule = {
			start: schedule.start,
			end: schedule.end,
			frequency: schedule.frequency,
			interval: schedule.interval,
		}
		const occurrences = ScheduleService.delfi.getOccurrences(occurrenceSchedule, { start, end }, true);
		return occurrences.map(startDate => {
			const occurrenceEnd = this.getBudgetOccurrenceEndDate(schedule, startDate);
			return {
				start: startDate,
				end: occurrenceEnd,
			}
		});
	}

	/**
	 * Computes the projection events for a given budget occurrence within a specified time window.
	 * @param windowAmount The total budget amount allocated for the time window.
	 * @param windowStart The start date of the time window.
	 * @param windowEnd The end date of the time window.
	 * @param occurrence The budget occurrence to compute events for.
	 * @returns An array of partial budget event constructions representing the projected events.
	 */
	private static computeProjectionEvents(windowAmount: number, windowStart: DelfiDate, windowEnd: DelfiDate, occurrence: BudgetOccurrence): ProjectionEvent[] {
		// // Short circuit for windows with no special projection rules
		// if (!occurrence.sourceSchedule.projectionSchedule) {
		// 	const events = BudgetUtils.createDateEventsFromOccurrenceDetails(windowStart, windowAmount, occurrence.budget, occurrence);
		// 	return events.map(event => ({
		// 		...event,
		// 		sourceOccurrence: occurrence,
		// 	} as ProjectionEvent));
		// }

		const projectionEvents: ProjectionEvent[] = [];
		// Get child items within this window
		const childItems = occurrence.budget.childItems?.filter(item => ddate(item.date).isBetweenInclusive(windowStart, windowEnd)) || [];

		let budgetUsedSoFar = 0;
		// Process child items into events
		for (const child of childItems) {
			const childEvents = BudgetUtils.createDateEventsFromOccurrenceDetails(ddate(child.date), child.amount, child, occurrence);
			childEvents.forEach(event => {
				event.projectionDetails.isPartial = true;
				event.projectionDetails.budgetCap = windowAmount;
				event.projectionDetails.budgetUsedSoFar = budgetUsedSoFar + child.amount;
				event.BudgetChildItem = child;

				budgetUsedSoFar += child.amount;
			});
			projectionEvents.push(...childEvents);
		}

		const budgetSchedule = occurrence.sourceSchedule.schedule;
		const projectionSchedule = occurrence.sourceSchedule.projectionSchedule;

		// Compute projection events based on the projection schedule, or just once on the start date
		const scheduledProjectionDates = projectionSchedule ?
			ScheduleService.delfi.getOccurrences({ start: budgetSchedule.start, ...projectionSchedule, frequency: projectionSchedule.frequency || budgetSchedule.frequency, interval: projectionSchedule.interval || budgetSchedule.interval }, { start: windowStart, end: windowEnd }, false)
			: [windowStart];

		// If children exceed or equal the budget, do not create projection events
		// NOTE the current logic will USUALLY work, unless the child items budget for some reason has a different sign than the main budget.
		// I don't really see anyone entering child budget items that are negative for a positive budget, or vice versa.
		if (Math.abs(budgetUsedSoFar) < Math.abs(windowAmount) && scheduledProjectionDates.length > 0) {
			// Remaining amount for projections
			const remainingAmount = windowAmount - budgetUsedSoFar;
			const eventAmount = remainingAmount / scheduledProjectionDates.length;

			for (let i = 0; i < scheduledProjectionDates.length; i++) {
				const intervalDate = scheduledProjectionDates[i];
				budgetUsedSoFar += eventAmount;
				projectionEvents.push(...BudgetUtils.createDateEventsFromOccurrenceDetails(intervalDate, eventAmount, occurrence.budget, occurrence).map(event => ({
					...event,
					isPartial: true as true,
					budgetCap: windowAmount,
					budgetSoFar: budgetUsedSoFar,
				})));
			}
		}

		return projectionEvents;
	}

	/**
	 * Triggered budgets always have a MONTHLY occurrence, but the user doesn't know that.
	 * This will make it more efficient and easy to create them from scheduled budgets.
	 * This assumes the UI most commonly breaks budgets down monthly
	 * @param monthStart 
	 * @param budget 
	 * @param triggerEvent 
	 * @returns 
	 */
	static createTriggeredOccurrenceForMonth(monthStart: DelfiDate, budget: TriggeredBudget, monthEvents: ProjectionEvent[]): BudgetOccurrence | undefined {
		// Find a schedule variant that matches the trigger event
		for (const variant of budget.scheduleVariants) {
			const variantNextOccurrence = ScheduleService.delfi.getNextOccurrence(variant.schedule, monthStart);
			if (!variantNextOccurrence || !variantNextOccurrence.isSame(monthStart, 'month')) {
				// If the variant's next occurrence is not in the same month, skip it
				continue;
			}

			// This variant matches the month, so we can create an occurrence for it
			const endDate = BudgetUtils.getBudgetOccurrenceEndDate(variant.schedule, monthStart);
			const occurrence: BudgetOccurrence = {
				occurrence_id: BudgetUtils.createOccurrenceId(budget, monthStart, endDate),
				budget,
				start: monthStart,
				end: endDate,
				budgetEvents: [],
				amount: 0, // This will be computed later
				sourceSchedule: variant,
			};

			const events = monthEvents.flatMap(event => {
				if (!FilterUtils.matches(variant.amountTemplate.trigger.filter, event)) {
					return []; // Skip events that don't match the trigger filter
				}
				const trigger = variant.amountTemplate.trigger;
				const triggeredAmount = computeTriggeredAmount(event.amount, trigger.computation);
				return BudgetUtils.createDateEventsFromOccurrenceDetails(event.date, triggeredAmount, occurrence.budget, occurrence).map(event => ({
					...event,
					triggerEvent: event,
				}));
			});

			occurrence.amount = events.reduce((sum, event) => sum + event.amount, 0);
			occurrence.budgetEvents = events;
			return occurrence;
		}

		return undefined; // No matching schedule variant found
	}

	private static getBudgetOccurrenceEndDate(schedule: BudgetOccurrenceSchedule, occurrenceStart: DelfiDate): DelfiDate {
		return occurrenceStart.add(schedule.interval || 1, toDelfiInterval(schedule.frequency)).subtract(1, 'day'); // Subtract one day to get the end of the occurrence, not the start of the next one
	}

	private static createDateEventsFromOccurrenceDetails(eventDate: DelfiDate, amount: number, details: BudgetedTransactionDetails, sourceOccurrence: BudgetOccurrence): ProjectionEvent[] {
		const base: ProjectionEvent = {
			Budget: sourceOccurrence.budget,
			displayName: details.memo,
			date: eventDate,
			year: eventDate.year(),
			month: eventDate.month(),
			day: eventDate.day(),
			amount,
			...BudgetUtils.copyTransactionDetails(details),

			projectionDetails: {
				...BudgetUtils.copyTransactionDetails(details),
				budget_event_id: sourceOccurrence.occurrence_id + '-' + sourceOccurrence.budgetEvents.length,
				sourceOccurrence,
			},
			attributionDetails: undefined,
		}
		const events: ProjectionEvent[] = [];
		// Origin transaction for Transfer
		// if (details.budgetType === BudgetType.TRANSFER && details.origin_account_id) {
		// 	// TODO don't allow transfers without origin account
		// 	events.push({
		// 		...base,
		// 		amount: -amount,
		// 		account_id: details.origin_account_id,
		// 		target_account_partition_id: details.origin_account_partition_id,
		// 		isTransferCopy: true,
		// 	});
		// }

		// Standard 1:1 schedule, or target for transfer
		events.push({
			...base,
			amount: amount,
		});
		return events;
	}

	static copyTransactionDetails(source: BudgetedTransactionDetails): BudgetedTransactionDetails {
		return {
			memo: source.memo,
			budgetType: source.budgetType,
			account_id: source.account_id,
			target_account_partition_id: source.target_account_partition_id,
			origin_account_id: source.origin_account_id,
			origin_account_partition_id: source.origin_account_partition_id,
			category_id: source.category_id,
			Category: source.Category,
			tag_ids: source.tag_ids,
			group_id: source.group_id,
		}
	}

	static createOccurrenceId(budget, start, end): string {
		return `${budget.budget_id}-${start.toString()}-${end.toString()}`;
	}
}
