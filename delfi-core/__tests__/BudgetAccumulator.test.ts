import Forecast from "../services/forecastService";
import { beforeEach, describe, expect, test } from 'vitest'
import { ImmediateMatchTrigger } from "../models/schedules/triggers";
import { XPerMonthSchedule } from "../models/schedules/XPerMonthSchedule";
import { MONTHS } from "../utils/constants";
import { TransactionScheduleType, type TransactionSchedule, type TransactionTrigger, type TransactionEvent } from "../services/transactionService";
import { date } from "../utils/dateUtils";
import Accumulator from "../models/Accumulator";
import { BudgetAccumulator } from "../models/Budget";

describe('BudgetAccumulator', () => {
	beforeEach(() => {
		
	})

	describe('createNewPeriod', () => {
		test('creates budgetPeriod with month boundaries and first month', () => {
			const bAcc = new BudgetAccumulator(
				'test-budget',
				0,
				[{
					operator: '*'
				}],
				{
					name: 'My Test Budget',
					budget_id: 'test-budget-id',
					amount: 1,
					numMonths: 3,
					recurrenceSchedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 1)),
					systemEventAccountId: 'test-account',
				}
			);

			// use day other than start of month
			bAcc.createNewPeriod(date('2022-01-05'), date('2022-01-05'));

			expect(bAcc.budgetPeriods.length).toBe(1);
			expect(bAcc.budgetPeriods[0].start.toString()).toBe('2022-01-01');
			expect(bAcc.budgetPeriods[0].end.toString()).toBe('2022-03-31');
			// should create the first month
			expect(bAcc.budgetPeriods[0].months.length).toBe(1);
			expect(bAcc.budgetPeriods[0].months[0].start.toString()).toBe('2022-01-01');
			expect(bAcc.budgetPeriods[0].months[0].end.toString()).toBe('2022-01-31');
		});
		
		test('adds months up to end of period', () => {
			const bAcc = new BudgetAccumulator(
				'test-budget',
				0,
				[{
					operator: '*'
				}],
				{
					name: 'My Test Budget',
					budget_id: 'test-budget-id',
					amount: 1,
					numMonths: 3,
					recurrenceSchedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 1)),
					systemEventAccountId: 'test-account',
				}
			);

			bAcc.createNewPeriod(date('2022-01-05'), date('2022-01-05'));
			bAcc.createNewPeriod(date('2022-02-05'), date('2022-02-05'));
			bAcc.createNewPeriod(date('2022-03-05'), date('2022-03-05'));

			expect(bAcc.budgetPeriods.length).toBe(1);
			// should create all 3 months
			expect(bAcc.budgetPeriods[0].months.length).toBe(3);
			expect(bAcc.budgetPeriods[0].months[2].start.toString()).toBe('2022-03-01');
			expect(bAcc.budgetPeriods[0].months[2].end.toString()).toBe('2022-03-31');

			// does not add more months
			bAcc.createNewPeriod(date('2022-04-05'), date('2022-04-05'));
			expect(bAcc.budgetPeriods[0].months.length).toBe(3);
		})

				
		test('creates new budget period after fist', () => {
			const bAcc = new BudgetAccumulator(
				'test-budget',
				50,
				[{
					operator: '*'
				}],
				{
					name: 'My Test Budget',
					budget_id: 'test-budget-id',
					amount: 1,
					numMonths: 3,
					recurrenceSchedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 1)),
					systemEventAccountId: 'test-account',
				}
			);

			bAcc.createNewPeriod(date('2022-01-05'), date('2022-01-05'));
			bAcc.createNewPeriod(date('2022-02-05'), date('2022-02-05'));
			bAcc.createNewPeriod(date('2022-03-05'), date('2022-03-05'));
			expect(bAcc.budgetPeriods.length).toBe(1);
			expect(bAcc.budgetPeriods[0].end.toString()).toBe('2022-03-31');
			expect(bAcc.budgetPeriods[0].endingBalance).toBe(50);

			// is after first period end, should create a new one
			bAcc.createNewPeriod(date('2022-04-05'), date('2022-04-05'));

			expect(bAcc.budgetPeriods.length).toBe(2);
			// should reset balance for new period
			expect(bAcc.budgetPeriods[1].startingBalance).toBe(0);
			expect(bAcc.budgetPeriods[1].start.toString()).toBe('2022-04-01');
			expect(bAcc.budgetPeriods[1].end.toString()).toBe('2022-06-30');
		})



				
		test('does not create new budget period after end date', () => {
			const bAcc = new BudgetAccumulator(
				'test-budget',
				0,
				[{
					operator: '*'
				}],
				{
					name: 'My Test Budget',
					budget_id: 'test-budget-id',
					amount: 1,
					numMonths: 3,
					recurrenceSchedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 1), new Date(2022, MONTHS.MAR, 31)),
					systemEventAccountId: 'test-account',
				}
			);

			bAcc.createNewPeriod(date('2022-01-05'), date('2022-01-05'));
			expect(bAcc.budgetPeriods.length).toBe(1);
			// is after budget end, should create a new period
			bAcc.createNewPeriod(date('2022-04-05'), date('2022-04-05'));

			expect(bAcc.budgetPeriods.length).toBe(1);
		})
	});


	describe('processNextTransaction', () => {
		test('adds events to budgetPeriod and latest month', () => {
			const bAcc = new BudgetAccumulator(
				'test-budget',
				0,
				[{
					operator: '*'
				}],
				{
					name: 'My Test Budget',
					budget_id: 'test-budget-id',
					amount: 1,
					numMonths: 3,
					recurrenceSchedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 1)),
					systemEventAccountId: 'test-account',
				}
			);
			// create two month periods
			bAcc.createNewPeriod(date('2022-01-01'), date('2022-01-01'));
			bAcc.createNewPeriod(date('2022-02-01'), date('2022-02-01'));

			const transaction: TransactionEvent = {
				id: 'test',
				amount: 1,
				memo: 'test',
				targetAccount: 'test_account',
				type: TransactionScheduleType.expense,
				date: date('2022-01-01'),
			}
			bAcc.processNextTransaction(transaction);
			expect(bAcc.budgetPeriods[0].events.length).toBe(1);
			expect(bAcc.budgetPeriods[0].months[0].events.length).toBe(0);
			expect(bAcc.budgetPeriods[0].months[1].events.length).toBe(1);
		})

		test('does not add events if budget period is not active', () => {
			const bAcc = new BudgetAccumulator(
				'test-budget',
				0,
				[{
					operator: '*'
				}],
				{
					name: 'My Test Budget',
					budget_id: 'test-budget-id',
					amount: 1,
					numMonths: 1,
					recurrenceSchedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.FEB, 1), new Date(2022, MONTHS.FEB, 30)),
					systemEventAccountId: 'test-account',
				}
			);
			// first period not active
			bAcc.createNewPeriod(date('2022-01-01'), date('2022-01-01'));
			expect(bAcc.budgetPeriods[0].start.toString()).toBe('2022-02-01');

			const transaction: TransactionEvent = {
				id: 'test',
				amount: 1,
				memo: 'test',
				targetAccount: 'test_account',
				type: TransactionScheduleType.expense,
				date: date('2022-01-01'),
			}
			bAcc.processNextTransaction(transaction);
			expect(bAcc.budgetPeriods[0].events.length).toBe(0);

			// add transaction while active
			bAcc.createNewPeriod(date('2022-02-01'), date('2022-02-01'));
			transaction.date = date('2022-02-01');
			bAcc.processNextTransaction(transaction);
			expect(bAcc.budgetPeriods[0].events.length).toBe(1);

			// add transaction after end
			bAcc.createNewPeriod(date('2022-03-01'), date('2022-03-01'));
			transaction.date = date('2022-03-01');
			bAcc.processNextTransaction(transaction);
			expect(bAcc.budgetPeriods[0].events.length).toBe(1);
		})
	});

	describe('doEndOfMonthTrigger', () => {
		test('triggers event for remaining budget if > 0', () => {
			const bAcc = new BudgetAccumulator(
				'test-budget',
				0,
				[{
					operator: '*'
				}],
				{
					name: 'My Test Budget',
					budget_id: 'test-budget-id',
					amount: 50,
					numMonths: 1,
					recurrenceSchedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.JAN, 1)),
					systemEventAccountId: 'test_account',
					categoryId: 'test_category',
				}
			);
			bAcc.createNewPeriod(date('2022-01-01'), date('2022-01-01'));
			// process transaction to change balance
			bAcc.processNextTransaction({
				id: 'test',
				amount: -25,
				memo: 'test',
				targetAccount: 'test_account',
				type: TransactionScheduleType.expense,
				date: date('2022-01-01'),
			});

			const triggeredEvents = bAcc.doEndOfMonthTrigger(date('2022-01-31'));
			expect(triggeredEvents.length).toBe(1);
			expect(triggeredEvents[0].amount).toBe(-25);
			expect(triggeredEvents[0].targetAccount).toBe('test_account');
			expect(triggeredEvents[0].budgetId).toBe('test-budget-id');
			expect(triggeredEvents[0].categoryId).toBe('test_category');
		})

		test('triggers no events if remaining budget <= 0', () => {
			const bAcc = new BudgetAccumulator(
				'test-budget',
				0,
				[{
					operator: '*'
				}],
				{
					name: 'My Test Budget',
					budget_id: 'test-budget-id',
					amount: 50,
					numMonths: 1,
					recurrenceSchedule: new XPerMonthSchedule(1, new Date(2022, MONTHS.JAN, 1)),
					systemEventAccountId: 'test-account',
				}
			);
			bAcc.createNewPeriod(date('2022-01-01'), date('2022-01-01'));
			// process transaction to change balance
			bAcc.processNextTransaction({
				id: 'test',
				amount: -50,
				memo: 'test',
				targetAccount: 'test_account',
				type: TransactionScheduleType.expense,
				date: date('2022-01-01'),
			});

			const triggeredEvents = bAcc.doEndOfMonthTrigger(date('2022-01-31'));
			expect(triggeredEvents.length).toBe(0);
		})
	})
})
