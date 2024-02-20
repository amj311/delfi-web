
import { beforeEach, describe, expect, test } from 'vitest'
import { MONTHS } from "../utils/constants";
import { PlannedTransactionType, type TransactionEvent } from "../models/Transaction";
import { date } from "../utils/dateUtils";
import { BudgetAccumulator } from "../models/Budget";

describe('BudgetAccumulator', () => {
	beforeEach(() => {
		
	})

	describe('onDayStart', () => {
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
					num_months: 3,
					schedule: { rrules: [ { start: '2021-04-01', frequency: 'MONTHLY', byDayOfMonth: [1] } ] },
					system_event_account_id: 'test-account',
					category_id: 'test-category',
				}
			);

			// use day other than start of month
			bAcc.onDayStart(date('2022-01-05'), date('2022-01-05'));

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
					num_months: 3,
					schedule: { rrules: [ { start: '2021-04-01', frequency: 'MONTHLY', byDayOfMonth: [1] } ] },
					system_event_account_id: 'test-account',
					category_id: 'test-category',
				}
			);

			bAcc.onDayStart(date('2022-01-05'), date('2022-01-05'));
			bAcc.onDayStart(date('2022-02-05'), date('2022-02-05'));
			bAcc.onDayStart(date('2022-03-05'), date('2022-03-05'));

			expect(bAcc.budgetPeriods.length).toBe(1);
			// should create all 3 months
			expect(bAcc.budgetPeriods[0].months.length).toBe(3);
			expect(bAcc.budgetPeriods[0].months[2].start.toString()).toBe('2022-03-01');
			expect(bAcc.budgetPeriods[0].months[2].end.toString()).toBe('2022-03-31');

			// does not add more months
			bAcc.onDayStart(date('2022-04-05'), date('2022-04-05'));
			expect(bAcc.budgetPeriods[0].months.length).toBe(3);
		})

				
		test('creates new budget period after first', () => {
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
					num_months: 3,
					schedule: { rrules: [ { start: '2021-04-01', frequency: 'MONTHLY', byDayOfMonth: [1] } ] },
					system_event_account_id: 'test-account',
					category_id: 'test-category',
				}
			);

			bAcc.onDayStart(date('2022-01-05'), date('2022-01-05'));
			bAcc.onDayStart(date('2022-02-05'), date('2022-02-05'));
			bAcc.onDayStart(date('2022-03-05'), date('2022-03-05'));
			expect(bAcc.budgetPeriods.length).toBe(1);
			expect(bAcc.budgetPeriods[0].end.toString()).toBe('2022-03-31');
			expect(bAcc.budgetPeriods[0].endingBalance).toBe(50);

			// is after first period end, should create a new one
			bAcc.onDayStart(date('2022-04-05'), date('2022-04-05'));

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
					num_months: 3,
					schedule: { rrules: [ { start: '2021-04-01', end: '2022-03-31', frequency: 'MONTHLY', byDayOfMonth: [1] } ] },
					system_event_account_id: 'test-account',
					category_id: 'test-category',
				}
			);

			bAcc.onDayStart(date('2022-01-05'), date('2022-01-05'));
			expect(bAcc.budgetPeriods.length).toBe(1);
			// is after budget end, should create a new period
			bAcc.onDayStart(date('2022-04-05'), date('2022-04-05'));

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
					num_months: 3,
					schedule: { rrules: [ { start: '2021-04-01', frequency: 'MONTHLY', byDayOfMonth: [1] } ] },
					system_event_account_id: 'test-account',
					category_id: 'test-category',
				}
			);
			// create two month periods
			bAcc.onDayStart(date('2022-01-01'), date('2022-01-01'));
			bAcc.onDayStart(date('2022-02-01'), date('2022-02-01'));

			const transaction: TransactionEvent = {
				id: 'test',
				amount: 1,
				memo: 'test',
				target_account_id: 'test_account',
				type: PlannedTransactionType.DEBIT,
				date: date('2022-01-01'),
				category_id: 'test-category',
				flags: [],
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
					num_months: 1,
					schedule: { rrules: [ { start: '2022-02-01', end: '2022-02-28', frequency: 'MONTHLY', byDayOfMonth: [1] } ] },
					system_event_account_id: 'test-account',
					category_id: 'test-category',
				}
			);
			// first period not active
			bAcc.onDayStart(date('2022-01-01'), date('2022-01-01'));
			expect(bAcc.budgetPeriods[0].start.toString()).toBe('2022-02-01');

			const transaction: TransactionEvent = {
				id: 'test',
				amount: 1,
				memo: 'test',
				target_account_id: 'test_account',
				type: PlannedTransactionType.DEBIT,
				date: date('2022-01-01'),
				category_id: 'test-category',
				flags: [],
			}
			bAcc.processNextTransaction(transaction);
			expect(bAcc.budgetPeriods[0].events.length).toBe(0);

			// add transaction while active
			bAcc.onDayStart(date('2022-02-01'), date('2022-02-01'));
			transaction.date = date('2022-02-01');
			bAcc.processNextTransaction(transaction);
			expect(bAcc.budgetPeriods[0].events.length).toBe(1);

			// add transaction after end
			bAcc.onDayStart(date('2022-03-01'), date('2022-03-01'));
			transaction.date = date('2022-03-01');
			bAcc.processNextTransaction(transaction);
			expect(bAcc.budgetPeriods[0].events.length).toBe(1);
		})
	});

	describe('doEndOfDayTrigger', () => {
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
					num_months: 1,
					schedule: { rrules: [ { start: '2022-01-01', frequency: 'MONTHLY', byDayOfMonth: [1] } ] },
					system_event_account_id: 'test-account',
					category_id: 'test-category',
				}
			);
			bAcc.onDayStart(date('2022-01-01'), date('2022-01-01'));
			// process transaction to change balance
			bAcc.processNextTransaction({
				id: 'test',
				amount: -25,
				memo: 'test',
				target_account_id: 'test_account',
				type: PlannedTransactionType.DEBIT,
				date: date('2022-01-01'),
				category_id: 'test_category',
				flags: [],
			});

			const triggeredEvents = bAcc.doEndOfDayTrigger(date('2022-01-31'));
			expect(triggeredEvents.length).toBe(1);
			expect(triggeredEvents[0].amount).toBe(-25);
			expect(triggeredEvents[0].target_account_id).toBe('test_account');
			expect(triggeredEvents[0].budgetId).toBe('test-budget-id');
			expect(triggeredEvents[0].category_id).toBe('test_category');
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
					num_months: 1,
					schedule: { rrules: [ { start: '2022-01-01', frequency: 'MONTHLY', byDayOfMonth: [1] } ] },
					system_event_account_id: 'test-account',
					category_id: 'test-category',
				}
			);
			bAcc.onDayStart(date('2022-01-01'), date('2022-01-01'));
			// process transaction to change balance
			bAcc.processNextTransaction({
				id: 'test',
				amount: -50,
				memo: 'test',
				target_account_id: 'test_account',
				type: PlannedTransactionType.DEBIT,
				date: date('2022-01-01'),
				category_id: 'test_category',
				flags: [],
			});

			const triggeredEvents = bAcc.doEndOfDayTrigger(date('2022-01-31'));
			expect(triggeredEvents.length).toBe(0);
		})
	})
})
