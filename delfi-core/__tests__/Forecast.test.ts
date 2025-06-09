import Forecast from "../models/Forecast";
import { beforeEach, describe, expect, test } from 'vitest'
import { ImmediateMatchTrigger } from "../models/schedules/triggers";
import { MONTHS } from "../utils/constants";
import { TransactionType, type TransactionBudget, type TriggeredBudget, RecurrenceType } from "../models/Budget";
import { date } from "../utils/dateUtils";
import Accumulator from "../models/Accumulator";
import BudgetService from "../services/BudgetService";
import type { Budget } from "../models/Budget";

const accounts = {
	afcu_checking: {
		id: "afcu_checking",
		name: "AFCU Checking",
		balance: 500,
	},
};
const plannedTransactions: TransactionBudget[] = [
	{
		budget_id: "clozdincome",
		type: TransactionType.CREDIT,
		memo: "Clozd Income",
		amount: 2500,
		target_account_id: accounts.afcu_checking.id,
		recurrence_type: RecurrenceType.SCHEDULE,
		schedule: { rrules: [ { start: '2021-04-25', frequency: 'MONTHLY', byDayOfMonth: [25] } ] },
		category_id: 'test-category',
	},
	{
		budget_id: "tithing",
		type: TransactionType.DEBIT,
		memo: "Tithing",
		target_account_id: accounts.afcu_checking.id,
		recurrence_type: RecurrenceType.TRIGGER,
		trigger: new ImmediateMatchTrigger({
			filter: [{
				property: 'type',
				operator: 'eq',
				operand: TransactionType.CREDIT,
			}],
			computation: {
				operator: 'percent',
				operand: 10
			}
		}),
		category_id: "",
	} as TriggeredBudget
]

describe('Forecast', () => {
	// let forecast! : Forecast;
	beforeEach(() => {
		
	})

	describe('computeForecast', () => {
		test('computes events', () => {
			const forecast = new Forecast({
				accumulators: [
					new Accumulator(
						'total',
						500,
						[{
							operator: '*',
						}]
					)
				],
				plannedTransactions: [plannedTransactions[0]],
				start: date('2023-01-01'),
				end: date('2023-01-31')
			});

			// check days accuracy
			expect(forecast.days).toHaveLength(31);
			expect(forecast.days[0].start.toString()).toBe('2023-01-01');
			expect(forecast.days[0].end.toString()).toBe('2023-01-01');
			expect(forecast.days[30].start.toString()).toBe('2023-01-31');
			expect(forecast.days[30].end.toString()).toBe('2023-01-31');
			// the 25th should have the only event
			for (let i in forecast.days) {
				expect(forecast.days[i].events).toHaveLength(i === '24' ? 1 : 0);
			}

			// Check event accuracy
			expect(forecast.events).toHaveLength(1);
			expect(forecast.events[0].date.toString()).toBe('2023-01-25');
			expect(forecast.events[0]).toMatchObject(expect.objectContaining({
				transaction: expect.objectContaining({
					target_account_id: 'afcu_checking',
					amount: 2500,
					sourceSchedule: plannedTransactions[0],
				}),
				accumulatorEvents: {
					total: expect.objectContaining({
						startingBalance: 500,
						endingBalance: 3000
					})
				}
			}))
		})
		test('computes triggered events', () => {
			const forecast = new Forecast({
				accumulators: [
					new Accumulator(
						'total',
						500,
						[{
							operator: '*',
						}]
					)
				],
				plannedTransactions,
				start: date('2023-01-01'),
				end: date('2023-01-31')
			});

			// check days accuracy
			// the 25th should have TWO events
			for (let i in forecast.days) {
				expect(forecast.days[i].events).toHaveLength(i === '24' ? 2 : 0);
			}

			// Check event accuracy
			expect(forecast.events).toHaveLength(2);
			expect(forecast.events[1].date.toString()).toBe('2023-01-25');
			expect(forecast.events[1]).toMatchObject(expect.objectContaining({
				transaction: expect.objectContaining({
					target_account_id: 'afcu_checking',
					amount: -250,
					sourceTrigger: plannedTransactions[1],
				}),
				accumulatorEvents: {
					total: expect.objectContaining({
						startingBalance: 3000,
						endingBalance: 2750
					})
				}
			}))
		})

		test('triggers and accumulates endOfMonth budget depletion', () => {
			const budget: TransactionBudget = {
				name: 'test-budget',
				budget_id: '',
				amount: 50,
				num_months: 1,
				schedule: { rrules: [ { start: '2021-01-01', frequency: 'MONTHLY', byDayOfMonth: [1] } ] },
				category_id: 'test-category',
				system_event_account_id: 'test-account',
			};
			const budgetAccumulator = BudgetService.createBudgetAccumulator(budget);
			const accountAccumulator = new Accumulator(
				'account_test-account',
				-25,
				[{
					property: 'target_account_id',
					operator: 'eq',
					operand: 'test-account',
				}]
			);
			const forecast = new Forecast({
				accumulators: [
					budgetAccumulator,
					accountAccumulator,
				],
				plannedTransactions: [],
				start: date('2023-01-01'),
				end: date('2023-01-31')
			});

			expect(forecast.events).toHaveLength(1);
			expect(budgetAccumulator.budgetPeriods[0].events).toHaveLength(1);
			expect(budgetAccumulator.budgetPeriods[0].endingBalance).toBe(-50);
			expect(accountAccumulator.events).toHaveLength(1);
			expect(accountAccumulator.endingBalance).toBe(-75);
		})

	})

	describe('getTimeline', () => {
		test('returns all intervals', () => {
			const forecast = new Forecast({
				accumulators: [
					new Accumulator(
						'total',
						500,
						[{
							operator: '*',
						}]
					)
				],
				plannedTransactions,
				start: date('2023-01-01'),
				end: date('2023-01-31')
			});
			const timeline = forecast.getTimeline(date('2023-01-01'), date('2023-01-31'));
			expect(timeline.periods.length).toBe(31);
			expect(timeline.periods[0].start.toString()).toBe('2023-01-01');
			expect(timeline.periods[0].end.toString()).toBe('2023-01-01');
			expect(timeline.periods[30].start.toString()).toBe('2023-01-31');
			expect(timeline.periods[30].end.toString()).toBe('2023-01-31');
		})

		test('snapshots on appropriate days', () => {
			const forecast = new Forecast({
				accumulators: [
					new Accumulator(
						'total',
						500,
						[{
							operator: '*',
						}]
					)
				],
				plannedTransactions,
				start: date('2023-01-01'),
				end: date('2023-01-31')
			});
			const timeline = forecast.getTimeline(date('2023-01-01'), date('2023-01-31'));

			expect(timeline.startingBalance('total')).toBe(500);
			expect(timeline.periods[24].start.toString()).toBe('2023-01-25');
 			expect(timeline.periods[24].startingBalance('total')).toBe(500);
			expect(timeline.periods[24].events).toHaveLength(2)
			expect(timeline.periods[24].endingBalance('total')).toBe(2750);
			expect(timeline.endingBalance('total')).toBe(2750);
		})


		test('gets subsequent periods', () => {
			const forecast = new Forecast({
				accumulators: [
					new Accumulator(
						'total',
						500,
						[{
							operator: '*',
						}]
					)
				],
				plannedTransactions,
				start: date('2023-01-01'),
				end: date('2023-03-31')
			});
			// check first month snapshots
			let timeline = forecast.getTimeline(date('2023-01-01'), date('2023-01-31'), 'week');
			expect(timeline.events).toHaveLength(2);
			expect(timeline.events[0].date.toString()).toBe('2023-01-25');
			// check second month snapshots
			timeline = forecast.getTimeline(date('2023-02-01'), date('2023-02-31'), 'week');
			expect(timeline.events).toHaveLength(2);
			expect(timeline.events[0].date.toString()).toBe('2023-02-25');
			// check third month snapshots
			timeline = forecast.getTimeline(date('2023-03-01'), date('2023-03-31'), 'week');
			expect(timeline.events).toHaveLength(2);
			expect(timeline.events[0].date.toString()).toBe('2023-03-25');
		})
	});
})
