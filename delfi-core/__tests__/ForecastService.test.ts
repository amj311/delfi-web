import { newDate } from "../utils/dateUtils";
import Forecast from "../services/forecastService";
import dayjs from "dayjs";
import { accounts, initialAccounts, scheduledTransactions } from "../dummyData";
import { describe, expect, test } from 'vitest'
import { ImmediateMatchTrigger } from "../../delfi-core/models/schedules/triggers";
import { XPerMonthSchedule } from "../../delfi-core/models/schedules/XPerMonthSchedule";
import { MONTHS } from "../../delfi-core/utils/constants";
import { TransactionType } from "../../delfi-core/models/transactions";

describe('ForecastServiceTest', () => {
	describe('computeForecast', () => {
		test ('generate triggered events', () => {

			let forecast = new Forecast({
				accounts: accounts,
				transactionSchedules: [
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
			});
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


// let start = newMoment(new Date(2022, MONTHS.JAN, 5))
// let day2 = newMoment(new Date(2022,MONTHS.NOV,6))

// let sched = new XPerMonthSchedule(2,new Date(2022,MONTHS.JAN,31))
// console.log(sched.getOccurrencesBetween(start,day2))

// console.log(day2.diff(start, 'M'))
