
/**
 * Central Delfi instance for registering all financial entities
 * and handling 
 */

import dayjs from "dayjs";
import type { Account } from "./models/Account";
import type { TransactionSchedule } from "./models/transactions/TransactionSchedule";
import ForecastService from "./services/forecastService";

export type DelfiConfig = {
	accounts: Account[],
	transactions: TransactionSchedule[]
}

export class Delfi {
	constructor(config?: DelfiConfig) {
		if (config) {
			this.init(config);
		}
	}

	init({
		accounts,
		transactions
	}: DelfiConfig): void {

		let forecast = ForecastService.computeForecast(accounts, transactions, dayjs(Date.now()), dayjs().endOf('year'))

		for (let month of forecast) {
			month.printReport();
		}

	}
}
