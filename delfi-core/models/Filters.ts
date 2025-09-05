import type { DelfiDate } from "delfi-core/utils/dateUtils"
import { type BudgetedTransactionDetails, type ProjectionEvent, type ScheduledBudget } from "./Budget"
import { getPropertyByPath } from "delfi-core/utils/miscUtils"
import { TransactionUtils, type AttributionEvent, type DescriptionBreakdown } from "delfi-core/models/Transaction"
import type { Category } from "delfi-core/models/Category"
import type { CommonEvent } from "delfi-core/models/Summary"
import type { TransactionRule } from "delfi-core/models/TransactionRule"

export type Predicate = {
	property: (keyof Filterable) | 'budget_id' | 'date' | 'year' | 'month' | 'day' | `${keyof typeof CustomGetters}.${string}`,
	operator: Operator,
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
type Filterable = BudgetedTransactionDetails | ScheduledBudget | ProjectionEvent | AttributionEvent | CommonEvent;
type Accumulatable = Filterable & { amount: number };


export default class FilterUtils {
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
		const matchingEvents = FilterUtils.filter(events, thisFilter);
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
				if (typeof value === 'string' && typeof operand === 'string' && value.includes(operand)) result = true;
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


	public static describeFilter(filter: TransactionFilter, defs: NonNullable<TransactionRule['defs']> = {}): string {
		return filter.map(rule => this.describeFilterRule(rule, defs)).join(' AND ');
	}

	public static describeFilterRule(rule: FilterRule, defs: TransactionRule['defs'] = {}): string {
		if ('AND' in rule) {
			return `${rule.AND.map(r => this.describeFilterRule(r, defs)).join(' AND ')}`;
		} else if ('OR' in rule) {
			return `${rule.OR.map(r => this.describeFilterRule(r, defs)).join(' OR ')}`;
		} else {
			return this.describePredicate(rule, defs);
		}
	}

	private static describePredicate(rule: Predicate, defs: Record<string, any>): string {
		const { property, operator, operand } = rule;
		const operatorDescription = OperatorDescriptions[operator];
		let operandString = Array.isArray(operand) ? `[${operand.map(o => defs[o]?.text || o).join(', ')}]` : (defs[operand?.toString() || '']?.text || operand);
		if (typeof operand === 'string') {
			operandString = `'${operandString}'`;
		}
		return `${PrettyProperties[property] || property} ${rule.not ? 'not ' : ''}${operatorDescription} ${operandString}`;
	}

	public static extractPredicates(filter: TransactionFilter): Predicate[] {
		const predicates: Predicate[] = [];
		const extract = (rule: FilterRule) => {
			if ('AND' in rule) {
				rule.AND.forEach(extract);
			} else if ('OR' in rule) {
				rule.OR.forEach(extract);
			} else {
				predicates.push(rule);
			}
		};
		filter.forEach(extract);
		return predicates;
	}
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

const Operators = ['*', 'eq', 'gt', 'gte', 'lt', 'lte', 'inc'] as const;
type Operator = (typeof Operators)[number];
type Operation<T> = (operand: T, value: T) => boolean;
const Operations: Record<Operator, Operation<any>> = {
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
} as const;

const OperatorDescriptions: Record<Operator, string> = {
	'*': 'is anything',
	'eq': 'is',
	'gt': '>',
	'gte': '>=',
	'lt': '<',
	'lte': '<=',
	'inc': 'includes',
};

const PrettyProperties: Record<string, string> = {
	merchant_id: 'Merchant',
	category_id: 'Category',
	group_id: 'Group',
	target_account_partition_id: 'Target Account Partition',
	budget_id: 'Budget',
	'Transaction.original_description': 'Description',
	'Transaction.merchant_id': 'Merchant',
	'Transaction.account_id': 'Account',
	'Transaction.origin_account_id': 'Origin Account',
	'Category.type': 'Category Type'
};