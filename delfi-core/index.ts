
/**
 * Central Delfi instance for registering all financial entities
 * and handling 
 */

import dayjs from "dayjs";
import type { Account } from "./models/Account";
import ForecastService, { type Snapshot } from "./services/forecastService";
import { TransactionType, type TransactionSchedule } from "./models/transactions";

export type DelfiConfig = {
	accounts: Account[],
	transactions: TransactionSchedule[]
}

export class Delfi {
	public forecast: Snapshot[] = [];
	public accounts: Account[] = [];
	public transactions: TransactionSchedule[] = [];

	constructor(config?: DelfiConfig) {
		if (config) {
			this.init(config);
		}
	}

	init({accounts, transactions}: DelfiConfig): void {
		this.accounts = accounts || [];
		this.transactions = transactions || [];
	}

	computeForecast() {
		let forecast = ForecastService.computeForecast(this.accounts, this.transactions, dayjs(Date.now()), dayjs().endOf('year'))

		console.table(forecast.map(snapshot => ({
			memo: snapshot.event.memo,
			date: dayjs(snapshot.date).format("M/DD/YYYY"),
			amount: `${snapshot.event.type === TransactionType.income ? '+' : ''}${snapshot.event.amount}`,
			balances: JSON.stringify(Array.from(snapshot.balances.values())),
		})))

		this.forecast = forecast;
		return forecast;
	}
}
