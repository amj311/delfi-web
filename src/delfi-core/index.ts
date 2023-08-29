
/**
 * Central Delfi instance for registering all financial entities
 * and handling 
 */

import type { Account } from "./models/Account";
import type { TransactionSchedule } from "./models/transactions/TransactionSchedule";

export class Delfi {
	constructor() {

	}

	initAccounts(accounts: Account[]): void {
		// TODO load JS account data and register live account instances
	}

	initTransactions(accounts: TransactionSchedule[]): void {
		// TODO load JS transactions data and register live transactions instances
	}

}