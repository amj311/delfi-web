
/**
 * Central Delfi instance for registering all financial entities
 * and handling 
 */

import dayjs from "dayjs";
import type { Account } from "./models/Account";
import { TransactionScheduleType, type TransactionSchedule } from "./models/transactions";
import Forecast from "./services/forecastService";

export type DelfiConfig = {
	accounts: {[key: string]: Account},
	transactions: TransactionSchedule[]
}

export class Delfi {
	public forecast!: Forecast;
	public accounts: {[key: string]: Account} = {};
	public transactions: TransactionSchedule[] = [];

	constructor(config?: DelfiConfig) {
		if (config) {
			this.init(config);
		}
	}

	init({accounts, transactions}: DelfiConfig): void {
		this.accounts = accounts || {};
		this.transactions = transactions || [];
		this.forecast = new Forecast({accounts: this.accounts, transactionSchedules: this.transactions});
	}

	computeForecast() {
		this.forecast.computeForecast(dayjs(Date.now()), dayjs().endOf('year'))
	}
}
