import { type TransactionDetails, type TransactionEvent, type TransactionSchedule } from "../models/Transaction"

type MatchingRule = {
	property?: 'budgetId' | 'amount' | 'memo' | 'type' | 'target_account_id' | 'category_id'
	operator: '*' | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'inc'
	operand?: number | string | string[]
}

export type TransactionFilter = MatchingRule[];

const FilterService = {
	matches(filter: TransactionFilter, transaction: TransactionDetails | TransactionSchedule | TransactionEvent): boolean {
		for (let rule of filter) {
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
		}
		return false;
	}
}
export default FilterService;
