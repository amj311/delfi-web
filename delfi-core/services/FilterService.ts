import type { DelfiDate } from "delfi-core/utils/dateUtils"
import { type TransactionDetails, type BudgetEvent, type ScheduledBudget } from "../models/Transaction"

export type MatchingRule = {
	property: 'date' | 'year' | 'month' | 'day' | 'budgetId' | 'amount' | 'memo' | 'type' | 'target_account_id' | 'target_account_partition_id' | 'category_id'
	operator: '*' | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'inc'
	operand?: number | string | string[] | DelfiDate
}

export type TransactionFilter = MatchingRule[];
type Filterable = TransactionDetails | ScheduledBudget | BudgetEvent;

const FilterService = {
	matches(filter: TransactionFilter, transaction: Filterable): boolean {
		let passingRules = filter.filter(rule => {
			const { property, operator, operand } = rule;
			const value = property ? transaction[property] : null;
			switch (operator) {
				case '*':
					return true;
				case 'eq':
					if (value === operand) return true;
					break;
				case 'neq':
					if (value !== operand) return true;
					break;
				case 'gt':
					if ((operand !== undefined) && (value > operand)) return true;
					break;
				case 'gte':
					if ((operand !== undefined) && (value >= operand)) return true;
					break;
				case 'lt':
					if ((operand !== undefined) && (value < operand)) return true;
					break;
				case 'lte':
					if ((operand !== undefined) && (value <= operand)) return true;
					break;
				case 'inc':
					if (Array.isArray(value) && value.includes(operand)) return true;
					break;
				default:
					break;
			}
			return false;
		});

		return passingRules.length === filter.length;
	},

	filter<T extends Filterable = Filterable>(transactions: T[], filter: TransactionFilter): T[] {
		if (!filter || filter.length === 0) return transactions;
		return transactions.filter(transaction => this.matches(filter, transaction));
	},

	accumulate(transactions: Array<BudgetEvent>, filter: TransactionFilter): number {
		const filteredTransactions = this.filter(transactions, filter);
		return filteredTransactions.reduce((acc, transaction) => acc + transaction.amount, 0);
	},
}
export default FilterService;
