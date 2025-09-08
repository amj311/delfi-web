import type { DelfiDate } from "delfi-core/utils/dateUtils"
import { type BudgetedTransactionDetails, type ProjectionEvent, type ScheduledBudget } from "./Budget"
import { getPropertyByPath } from "delfi-core/utils/miscUtils"
import { TransactionUtils, type AttributionEvent, type DescriptionBreakdown } from "delfi-core/models/Transaction"
import type { Category } from "delfi-core/models/Category"
import type { CommonEvent } from "delfi-core/models/Summary"
import type { TransactionRule } from "delfi-core/models/TransactionRule"
import Descriptor, { SpecialEntityTypes } from "delfi-core/utils/Descriptor"

export type Predicate = {
	property: Property,
	operator: Operator,
	not?: boolean // If true, the rule is inverted
	operand?: number | string | string[] | DelfiDate
}

export type FilterRule = Predicate | AndBlock | OrBlock | null;

export type AndBlock = {
	AND: Array<FilterRule>;
}
export type OrBlock = {
	OR: Array<FilterRule>;
}
export type EitherFilter = {
	AND?: Array<FilterRule>;
	OR?: Array<FilterRule>;
}
export type TransactionFilter = AndBlock | OrBlock | null; // Empty object for no filter

type Filterable = BudgetedTransactionDetails | ScheduledBudget | ProjectionEvent | AttributionEvent | CommonEvent;
type Accumulatable = Filterable & { amount: number };


export default class FilterUtils {
	public static filter<T extends Filterable = Filterable>(transactions: T[], filter: TransactionFilter): T[] {
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
	public static accumulateUpTo(events: Array<Accumulatable>, date: DelfiDate, filter: TransactionFilter = { AND: [] }) {
		const thisFilter: TransactionFilter = {
			AND: [
				filter,
				{ property: 'date', operator: 'lt', operand: date },
			]
		};
		const matchingEvents = FilterUtils.filter(events, thisFilter);
		return this.accumulate(matchingEvents, thisFilter);
	}

	public static matches(rule: FilterRule, transaction: Filterable): boolean {
		if (rule === null) {
			return true; // Null rule
		}
		// Check empty rules
		if (Object.keys(rule).length === 0) {
			return true; // Empty rule
		}
		if ('AND' in rule) {
			return this.evaluateAndFilter(rule.AND, transaction);
		} else if ('OR' in rule) {
			return this.evaluateOrFilter(rule.OR, transaction);
		} else {
			return this.evaluatePredicate(rule, transaction);
		}
	}

	private static evaluateAndFilter(filter: Array<FilterRule>, transaction: Filterable): boolean {
		if (filter.length === 0) return true;
		return filter.every(rule => this.matches(rule, transaction));
	}

	private static evaluateOrFilter(filter: Array<FilterRule>, transaction: Filterable): boolean {
		if (filter.length === 0) return false;
		return filter.some(rule => this.matches(rule, transaction));
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
			// case '*':
			// 	return true;
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
			case 'in':
				if (Array.isArray(operand) && operand.includes(value)) result = true;
				if (typeof operand === 'string' && typeof value === 'string' && operand.includes(value)) result = true;
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


	public static describeFilter(rule: FilterRule): Descriptor {
		const descriptor = new Descriptor();
		this.getRuleDescriptorNodes(rule, descriptor);
		return descriptor;
	}

	private static getRuleDescriptorNodes(rule: FilterRule, descriptor: Descriptor): void {
		if (rule === null) {
			descriptor.push('<empty rule>');
		}
		else if ('AND' in rule) {
			rule.AND.forEach((r, i) => {
				this.getRuleDescriptorNodes(r, descriptor)
				if (i < rule.AND.length - 1) {
					descriptor.push(' and ');
				}
			});
		} else if ('OR' in rule) {
			rule.OR.forEach((r, i) => {
				this.getRuleDescriptorNodes(r, descriptor)
				if (i < rule.OR.length - 1) {
					descriptor.push(' or ');
				}
			});
		} else {
			this.describePredicate(rule, descriptor);
		}
	}

	private static describePredicate(rule: Predicate, descriptor: Descriptor): void {
		const { property, operator, operand } = rule;
		descriptor.push(`${Properties[property]?.label || property} `);
		if (rule.not) {
			descriptor.push('not ');
		}
		descriptor.push(OperatorDescriptions[operator] || operator, ' ');
		// Handle operand description(s)
		if (Array.isArray(operand)) {
			descriptor.push(' [');
			operand.forEach((o, i) => {
				this.addOperandDescriptionNodes(property, o, descriptor);
				if (i < operand.length - 1) {
					descriptor.push(', ');
				}
			});
			descriptor.push('] ');
		}
		else {
			this.addOperandDescriptionNodes(property, operand, descriptor);
		}
	}

	private static addOperandDescriptionNodes(property: Property, operandItem: any, descriptor: Descriptor): void {
		const type = Properties[property].type;
		const entityType = SpecialEntityTypes.find(t => type.includes(t)); // Transaction.merchant_id -> merchant_id
		console.log("filter type", type, entityType);
		if (entityType) {
			descriptor.push({ type: entityType, id: operandItem });
		} else {
			descriptor.push(JSON.stringify(operandItem));
		}
	}

	public static extractPredicates(filter: FilterRule): Predicate[] {
		const predicates: Predicate[] = [];
		const extract = (rule: FilterRule) => {
			if (rule === null) {
				return;
			}
			if ('AND' in rule) {
				rule.AND.forEach(extract);
			} else if ('OR' in rule) {
				rule.OR.forEach(extract);
			} else if (Array.isArray(rule)) {
				rule.forEach(extract);
			} else {
				predicates.push(rule);
			}
		};
		if (filter) {
			extract(filter);
		}
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

export const Operators = ['eq', 'gt', 'gte', 'lt', 'lte', 'inc', 'in'] as const;
type Operator = (typeof Operators)[number];
type Operation<T> = (operand: T, value: T) => boolean;
const Operations: Record<Operator, Operation<any>> = {
	// '*': () => true,
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
	},
	'in': (operand, value) => {
		if (Array.isArray(operand)) {
			return operand.includes(value);
		}
		return false;
	},
} as const;

export const OperatorDescriptions: Record<Operator, string> = {
	// '*': 'is anything',
	'eq': 'is',
	'gt': '>',
	'gte': '>=',
	'lt': '<',
	'lte': '<=',
	'inc': 'includes',
	'in': 'in',
};

export const Properties = {
	'date': { label: 'Date', type: 'date' },
	'year': { label: 'Year', type: 'year' },
	'month': { label: 'Month', type: 'month' },
	'day': { label: 'Day', type: 'day' },
	
	'amount': { label: 'Amount', type: 'currency' },
	'account_id': { label: 'Account', type: 'account_id', allowedOperators: ['eq'] },
	'origin_account_id': { label: 'Origin Account', type: 'origin_account_id', allowedOperators: ['eq'] },
	'account_partition_id': { label: 'Account Partition', type: 'account_partition_id', allowedOperators: ['eq'] },
	'origin_account_partition_id': { label: 'Origin Account Partition', type: 'origin_account_partition_id', allowedOperators: ['eq'] },

	'category_id': { label: 'Category', type: 'category_id', allowedOperators: ['eq', 'in'] },
	'Category.type': { label: 'Category Type', type: 'Category.type', allowedOperators: ['eq', 'in'] },
	'budget_id': { label: 'Budget', type: 'budget_id', allowedOperators: ['eq'] },
	'group_id': { label: 'Group', type: 'group_id', allowedOperators: ['eq'] },

	// 'merchant_id': { label: 'Merchant', type: 'merchant', allowedOperators: ['eq'] },
	'Transaction.merchant_id': { label: 'Merchant', type: 'merchant_id', allowedOperators: ['eq'] },

	'Transaction.original_description': { label: 'Description', type: 'string' },
} as const;
type Property = keyof typeof Properties;