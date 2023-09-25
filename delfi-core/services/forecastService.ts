import { newDate } from "../utils/dateUtils";
import { type TransactionEvent, TransactionType } from "../models/transactions";
import { MonthSummary } from "../models/MonthSummary";
import TransactionService from "./transactionService";

export type Snapshot = {
	balances: Map<string, any>,
	event: TransactionEvent,
	date: string
}

export default class ForecastService {
    static computeForecast(initialBalances, scheduledTransactions, begin, end) {
        let now = newDate(begin)
        end = newDate(end);
    
        let events:TransactionEvent[] = [];
        for (let t of scheduledTransactions) { 
            events.push(...TransactionService.generateEventsBetween(now,end,t)) 
        }
        events.sort((a,b)=>(a.date < b.date) ? -1 : ((a.date > b.date) ? 1 : 0));
    
        // set initial
        let accounts = new Map();
        for (let a  of initialBalances){
            accounts.set(a.id, {...a, balance: a.initialBalance})
        }
    
        let accountsCopy = this.copyAccounts(accounts);
		let snapshots: Snapshot[] = [];

		for (let event of events) {
            let eventDate = newDate(event.date);
            if (eventDate.isAfter(end)) break;

            accountsCopy = this.copyAccounts(accountsCopy)

            // Handle Income
            if (event.type === TransactionType.income) {
                let changedAccount = accountsCopy.get(event.targetAccount)
                changedAccount.balance += event.amount
            }

            if (event.type === TransactionType.expense) {
                let changedAccount = accountsCopy.get(event.targetAccount)
                changedAccount.balance -= event.amount
            }

            if (event.type === TransactionType.transfer) {
                let target = accountsCopy.get(event.targetAccount)
                let origin = accountsCopy.get(event.originAccount)
                target.balance += event.amount
                origin.balance -= event.amount
            }

            // Nice logging per transaction, could be useful somewhere.
            //
            // console.log("\n--- "+format(event.date)+" ---")
            // let sign = event.amount > 0 ? '💹' : '🔻'
            // console.log(sign+" $"+Math.abs(event.amount)+" for "+event.memo)
            // console.log(changedAccount.toString())
            // if (changedAccount.balance < 0) {
            //     console.log("⭕ NEGATIVE BALANCE !!!")
            // }

			snapshots.push({
				date: eventDate,
				balances: this.copyAccounts(accountsCopy),
				event,
			})

        }
        return snapshots;
    }

    static copyAccounts(accounts) {
        let newAccounts = new Map();
        for (let a of accounts.values()) {
            newAccounts.set(a.id, {...a})
        }
        return newAccounts
    }
}
