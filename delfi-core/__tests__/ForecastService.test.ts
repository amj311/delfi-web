import Forecast from "../services/forecastService";
import { beforeEach, describe, expect, test } from 'vitest'
import { ImmediateMatchTrigger } from "../../delfi-core/models/schedules/triggers";
import { XPerMonthSchedule } from "../../delfi-core/models/schedules/XPerMonthSchedule";
import { MONTHS } from "../../delfi-core/utils/constants";
import { TransactionType } from "../../delfi-core/models/transactions";

const accounts = {
	afcu_checking: {
		id: "afcu_checking",
		name: "AFCU Checking",
		balance: 500,
	},
};
const transactionSchedules = [
	{
		id: "clozdincome",
		type: 'income',
		memo: "Clozd Income",
		amount: 2500,
		targetAccount: accounts.afcu_checking.id,
		recurrenceType: 'schedule',
		schedule: new XPerMonthSchedule(1, new Date(2021, MONTHS.APR, 25))
	},
	{
		id: "tithing",
		type: TransactionType.expense,
		memo: "Tithing",
		targetAccount: accounts.afcu_checking.id,
		recurrenceType: 'trigger',
		trigger: new ImmediateMatchTrigger({
			rules: [{
				property: 'type',
				operator: 'eq',
				operand: 'income',
			}],
			computation: {
				operator: 'percent',
				operand: 10
			}
		})
	}
]

describe('Forecast', () => {
	let forecast! : Forecast;
	beforeEach(() => {
		forecast = new Forecast({
			accounts,
			transactionSchedules,
		});
	})

	describe('getTimeline', () => {
		test('returns all intervals', () => {
			forecast.computeForecast('2023-01-01', '2023-02-01');
			const timeline = forecast.getTimeline('2023-01-01', '2023-02-01');
			expect(timeline.length).toBe(31);
			expect(timeline[0].start).toBe('2023-01-01T07:00:00.000Z');
			expect(timeline[0].end).toBe('2023-01-02T06:59:59.999Z');
			expect(timeline[30].start).toBe('2023-01-31T07:00:00.000Z');
			expect(timeline[30].end).toBe('2023-02-01T06:59:59.999Z');
		})

		test('snapshots on appropriate days', () => {
			forecast.computeForecast('2023-01-01', '2023-02-01');
			const timeline = forecast.getTimeline('2023-01-01', '2023-02-01');
			
			expect(timeline[24].start).toBe('2023-01-25T07:00:00.000Z');
 			expect(timeline[24].startingBalances).toMatchObject(accounts);
			expect(timeline[24].snapshots).toHaveLength(2)
			expect(timeline[24].endingBalances).toMatchObject({
				afcu_checking: {
					id: "afcu_checking",
					name: "AFCU Checking",
					balance: 2750,
				}
			})
		})
	});

	describe('computeForecast', () => {
		test('generates triggered events', () => {
			const events = forecast.computeForecast('2023-01-01', '2023-02-01');
			expect(events.length).toBe(2);
			expect(events[1].event.type).toBe(TransactionType.expense);
			expect(events[1].event.amount).toBe(250);
		})

		// test('computes events', () => {
		// 	let forecast = new Forecast({
		// 		accounts: initialAccounts,
		// 		transactionSchedules: scheduledTransactions
		// 	});
		// 	const events = forecast.computeForecast(accounts, scheduledTransactions,
		// 		newDate(Date.now()), dayjs().endOf('year')
		// 	);
		// 	console.log(JSON.stringify(events, null, 2))
		// })
		
	})
})
