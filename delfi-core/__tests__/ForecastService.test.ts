import Forecast from "../services/forecastService";
import { beforeEach, describe, expect, test } from 'vitest'
import { ImmediateMatchTrigger } from "../models/schedules/triggers";
import { XPerMonthSchedule } from "../models/schedules/XPerMonthSchedule";
import { MONTHS } from "../utils/constants";
import { TransactionScheduleType, type TransactionSchedule, type TransactionTrigger } from "../services/transactionService";
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
const transactionSchedules: TransactionSchedule[] = [
	{
		id: "clozdincome",
		type: TransactionScheduleType.income,
		memo: "Clozd Income",
		amount: 2500,
		targetAccount: accounts.afcu_checking.id,
		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 25))
	},
];
const transactionTriggers: TransactionTrigger[] = [
	{
		id: "tithing",
		type: TransactionScheduleType.expense,
		memo: "Tithing",
		targetAccount: accounts.afcu_checking.id,
		recurrenceType: 'trigger',
		trigger: new ImmediateMatchTrigger({
			filter: [{
				property: 'type',
				operator: 'eq',
				operand: TransactionScheduleType.income,
			}],
			computation: {
				operator: 'percent',
				operand: 10
			}
		})
	}
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
				transactionSchedules,
				transactionTriggers: [],
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
					targetAccount: 'afcu_checking',
					amount: 2500,
					sourceSchedule: transactionSchedules[0],
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
				transactionSchedules,
				transactionTriggers,
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
					targetAccount: 'afcu_checking',
					amount: -250,
					sourceTrigger: transactionTriggers[0],
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
			const budget: Budget = {
				name: 'test-budget',
				budget_id: '',
				amount: 50,
				numMonths: 1,
				recurrenceSchedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.JAN, 1)),
				systemEventAccountId: 'test-account',
			};
			const budgetAccumulator = BudgetService.createBudgetAccumulator(budget);
			const accountAccumulator = new Accumulator(
				'account_test-account',
				-25,
				[{
					property: 'targetAccount',
					operator: 'eq',
					operand: 'test-account',
				}]
			);
			const forecast = new Forecast({
				accumulators: [
					budgetAccumulator,
					accountAccumulator,
				],
				transactionSchedules: [],
				transactionTriggers: [],
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
				transactionSchedules,
				transactionTriggers,
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
				transactionSchedules,
				transactionTriggers,
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
				transactionSchedules,
				transactionTriggers,
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
