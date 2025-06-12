import type { DelfiDate } from "delfi-core/utils/dateUtils"
import { type BudgetedTransactionDetails, type BudgetEvent, type ScheduledBudget } from "../models/Budget"
import { getPropertyByPath } from "delfi-core/utils/miscUtils"

export type MatchingRule = {
	property: 'date' | 'year' | 'month' | 'day' | 'budgetId' | 'amount' | 'memo' | 'type' | 'target_account_id' | 'target_account_partition_id' | 'category_id' | 'Category.type'
	operator: '*' | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'inc'
	not?: boolean // If true, the rule is inverted
	operand?: number | string | string[] | DelfiDate
}

export type TransactionFilter = MatchingRule[];
type Filterable = BudgetedTransactionDetails | ScheduledBudget | BudgetEvent;

const FilterService = {
	matches(filter: TransactionFilter, transaction: Filterable): boolean {
		let passingRules = filter.filter(rule => {
			const { property, operator, operand } = rule;
			const value = property ? getPropertyByPath(transaction, property) : null;
			let result = false;

			switch (operator) {
				case '*':
					return true;
				case 'eq':
					if (value === operand) result = true;
					break;
				case 'gt':
					if ((operand !== undefined) && (value > operand)) result = true;
					break;
				case 'gte':
					if ((operand !== undefined) && (value >= operand)) result = true;
					break;
				case 'lt':
					if ((operand !== undefined) && (value < operand)) result = true;
					break;
				case 'lte':
					if ((operand !== undefined) && (value <= operand)) result = true;
					break;
				case 'inc':
					if (Array.isArray(value) && value.includes(operand)) result = true;
					break;
				default:
					break;
			}

			return rule.not ? !result : result;
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
