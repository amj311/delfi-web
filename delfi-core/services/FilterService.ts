import type { DelfiDate } from "delfi-core/utils/dateUtils"
import { type BudgetedTransactionDetails, type ProjectionEvent, type ScheduledBudget } from "../models/Budget"
import { getPropertyByPath } from "delfi-core/utils/miscUtils"
import { TransactionUtils, type CommonEventDetails, type DescriptionBreakdown } from "delfi-core/models/Transaction"
import type { Category } from "delfi-core/models/Category"

export type Predicate = {
	property: (keyof Filterable) | 'budget_id' | 'date' | 'year' | 'month' | 'day' | `${keyof typeof CustomGetters}.${string}`,
	operator: keyof typeof Operators,
	not?: boolean // If true, the rule is inverted
	operand?: number | string | string[] | DelfiDate
}

type FilterRule = Predicate | AndFilter | OrFilter;
export type TransactionFilter = Array<FilterRule>;

type AndFilter = {
	AND: TransactionFilter;
}
type OrFilter = {
	OR: TransactionFilter;
}
type Filterable = BudgetedTransactionDetails | ScheduledBudget | ProjectionEvent | CommonEventDetails;
type Accumulatable = Filterable & { amount: number };


export default class FilterService {
	public static filter<T extends Filterable = Filterable>(transactions: T[], filter: TransactionFilter): T[] {
		if (!filter || filter.length === 0) return transactions;
		return transactions.filter(transaction => this.matches(filter, transaction));
	}

	public static accumulate(transactions: Array<Accumulatable>, filter: TransactionFilter): number {
		const filteredTransactions = this.filter(transactions, filter);
		return filteredTransactions.reduce((acc, transaction) => acc + transaction.amount, 0);
	}

	/**
	 * Computes the accumulation of all transactions up to the given date BUT NOT INCLUDING, filtered by the provided filter.
	 * @param events
	 * @param date 
	 * @param filter
	 */
	public static accumulateUpTo(events: Array<Accumulatable>, date: DelfiDate, filter: TransactionFilter = []) {
		const thisFilter: TransactionFilter = [
			...filter,
			{ property: 'date', operator: 'lt', operand: date },
		];
		const matchingEvents = FilterService.filter(events, thisFilter);
		return this.accumulate(matchingEvents, thisFilter);
	}


	public static matches(filter: TransactionFilter, transaction: Filterable): boolean {
		return filter.every(rule => this.evaluateFilterRule(rule, transaction));
	}

	private static evaluateFilterRule(rule: FilterRule, transaction: Filterable): boolean {
		if (Array.isArray(rule)) {
			return this.evaluateAndFilter(rule, transaction);
		} else if ('AND' in rule) {
			return this.evaluateAndFilter(rule.AND, transaction);
		} else if ('OR' in rule) {
			return this.evaluateOrFilter(rule.OR, transaction);
		} else {
			return this.evaluatePredicate(rule, transaction);
		}
	}

	private static evaluateAndFilter(filter: Array<FilterRule>, transaction: Filterable): boolean {
		if (filter.length === 0) return true;
		return filter.every(rule => this.evaluateFilterRule(rule, transaction));
	}

	private static evaluateOrFilter(filter: Array<FilterRule>, transaction: Filterable): boolean {
		if (filter.length === 0) return false;
		return filter.some(rule => this.evaluateFilterRule(rule, transaction));
	}

	private static evaluatePredicate(rule: Predicate, obj: Filterable): boolean {
		const { property, operator, operand } = rule;

		// Allow for some custom operators to extract complex values
		let value;
		const customGetter = property.split('.')[0];
		if (CustomGetters[customGetter]) {
			const getterProperty = property.split('.').slice(1).join('.');
			value = CustomGetters[customGetter](obj, getterProperty);
		}
		else value = property ? getPropertyByPath(obj, property) : null;

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
		
		// const operatorResult = Operators[operator](value, operand);
		// if (operatorResult !== result) {
		// 	console.log(`FilterService: Rule mismatch for property "${property}" with operator "${operator}". Expected: ${result}, got: ${operatorResult}`);
		// }

		return rule.not ? !result : result;
	};
}

/**
 * CustomGetters are prefixes on the filter 'property' that extract complex values from the object.
 */
const CustomGetters: Record<string, (obj: Filterable, property: any) => any> = {
	Category(obj: any, property: keyof Category) {
		if (!(obj.Category)) {
			return null;
		}
		return getPropertyByPath(obj.Category, property);
	},

	Transaction(obj: any, property: string) {
		if (!(obj.sourceTransaction)) {
			return null;
		}
		return getPropertyByPath(obj.sourceTransaction, property);
	},

	DescriptionBreakdown(obj: any, property: keyof DescriptionBreakdown) {
		const description = obj.sourceTransaction?.original_description || obj.original_description;
		const breakdown = TransactionUtils.extractDescriptionInfo(description);
		if (!breakdown) {
			return null;
		}
		return getPropertyByPath(breakdown, property);
	},
} as const;

type Operation<T> = (operand: T, value: T) => boolean;
const Operators: Record<string, Operation<any>> = {
	'*': () => true,
	'eq': (operand, value) => value === operand,
	'gt': (operand, value) => value > operand,
	'gte': (operand, value) => value >= operand,
	'lt': (operand, value) => value < operand,
	'lte': (operand, value) => value <= operand,
	'inc': (operand, value) => {
		if (Array.isArray(value)) {
			return value.includes(operand);
		}
		if (typeof value === 'string') {
			return value.includes(operand as string);
		}
		return false;
	}
};
