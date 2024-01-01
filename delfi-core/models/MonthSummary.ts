import * as currencyUtils from "../utils/currencyUtils";
import { date } from "../utils/dateUtils";
import { Snapshot } from "./Snapshot";
import { TransactionScheduleType } from "./transactions";


export class MonthSummary {
    id;
    date;
    snapshots: Snapshot[] = [];
    report = {
        accountChanges: new Map(),
        totalExpense: 0,
        totalIncome: 0,
        netGrowth: 0
    };

    constructor(date, public initialBalances = new Map()) {
        this.date = date(date);
        this.id = this.date.format("YYYY-MM");

        for (let acct of initialBalances.values()) {
            this.report.accountChanges.set(acct.id, {
                totalExpense: 0,
                totalIncome: 0,
                netGrowth: 0
            });
        }
    }

    addSnapshot(snapshot: Snapshot) {
        this.snapshots.push(snapshot);
        let details = snapshot.mostRecentEvent.details;
        let changes = this.report.accountChanges.get(details.targetAccount);
        if (details.type === TransactionScheduleType.income) {
            changes.totalIncome += details.amount;
            this.report.totalIncome += details.amount;
        }
        else if (details.type === TransactionScheduleType.expense) {
            changes.totalExpense += details.amount;
            this.report.totalExpense += details.amount;
        }
        changes.netGrowth = changes.totalIncome - changes.totalExpense;
        this.report.netGrowth = this.report.totalIncome - this.report.totalExpense;
    }

    printReport() {
        console.log("\n----- " + this.date.format("MMM, YYYY") + " -----");
        console.log("Income: " + currencyUtils.prettyMoney(this.report.totalIncome));
        console.log("Expense: " + currencyUtils.prettyMoney(this.report.totalExpense));
        let sign = this.report.netGrowth > 0 ? '💹' : '🔻';
        console.log("Growth: " + sign + " " + currencyUtils.prettyMoney(this.report.netGrowth));

        console.log("End Balance:");
        for (let acct of this.getEndBalances().values()) {
            let msg = acct.balance < 0 ? ' 🚨' : '';
            console.log(`  ${acct.name}: ${acct.balance} ${msg}`);
        }
    }

    getEndBalances() {
        return this.snapshots[this.snapshots.length - 1]?.balances;
    }

    toString() {
    }

}
