import type { DelfiDate } from "delfi-core/utils/dateUtils"
import { type BudgetedTransactionDetails, type ProjectionEvent, type ScheduledBudget } from "./Budget"
import { getPropertyByPath } from "delfi-core/utils/miscUtils"
import { TransactionUtils, type AttributionEvent, type DescriptionBreakdown } from "delfi-core/models/Transaction"
import type { Category } from "delfi-core/models/Category"
import type { CommonEvent } from "delfi-core/models/Summary"
import Descriptor, { SpecialEntityTypes } from "delfi-core/utils/Descriptor"

export type Predicate = {
	property: Property,
	operator: Operator,
	not?: boolean // If true, the block is inverted
	operand?: number | string | string[] | DelfiDate
}

export type FilterBlock = Predicate | AndBlock | OrBlock | null;

export type AndBlock = {
	AND: Array<FilterBlock>;
}
export type OrBlock = {
	OR: Array<FilterBlock>;
}
export type EitherFilter = {
	AND?: Array<FilterBlock>;
	OR?: Array<FilterBlock>;
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

	public static matches(block: FilterBlock, transaction: Filterable): boolean {
		if (block === null) {
			return true; // Null block
		}
		// Check empty blocks
		if (Object.keys(block).length === 0) {
			return true; // Empty block
		}
		if ('AND' in block) {
			return this.evaluateAndFilter(block.AND, transaction);
		} else if ('OR' in block) {
			return this.evaluateOrFilter(block.OR, transaction);
		} else {
			return this.evaluatePredicate(block, transaction);
		}
	}

	private static evaluateAndFilter(filter: Array<FilterBlock>, transaction: Filterable): boolean {
		if (filter.length === 0) return true;
		return filter.every(block => this.matches(block, transaction));
	}

	private static evaluateOrFilter(filter: Array<FilterBlock>, transaction: Filterable): boolean {
		if (filter.length === 0) return false;
		return filter.some(block => this.matches(block, transaction));
	}

	private static evaluatePredicate(block: Predicate, obj: Filterable): boolean {
		const { property, operator, operand } = block;

		// Allow for some custom operators to extract complex values
		const value = this.getFilterableValue(obj, property);

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
		// 	console.log(`FilterService: Block mismatch for property "${property}" with operator "${operator}". Expected: ${result}, got: ${operatorResult}`);
		// }
		return block.not ? !result : result;
	};

	public static getFilterableValue(obj: Filterable, property: Property): any {
		let value;
		const customGetter = property.split('.')[0];
		if (CustomGetters[customGetter]) {
			const getterProperty = property.split('.').slice(1).join('.');
			value = CustomGetters[customGetter](obj, getterProperty);
		}
		else value = property ? getPropertyByPath(obj, property) : null;
		return value;
	}


	public static describeFilter(block: FilterBlock): Descriptor {
		const descriptor = new Descriptor();
		this.getBlockDescriptorNodes(block, descriptor);
		return descriptor;
	}

	private static getBlockDescriptorNodes(block: FilterBlock, descriptor: Descriptor): void {
		if (block === null) {
			descriptor.push('<empty block>');
		}
		else if ('AND' in block) {
			block.AND.forEach((r, i) => {
				this.getBlockDescriptorNodes(r, descriptor)
				if (i < block.AND.length - 1) {
					descriptor.push(' and ');
				}
			});
		} else if ('OR' in block) {
			block.OR.forEach((r, i) => {
				this.getBlockDescriptorNodes(r, descriptor)
				if (i < block.OR.length - 1) {
					descriptor.push(' or ');
				}
			});
		} else {
			this.describePredicate(block, descriptor);
		}
	}

	public static describePredicate(block: Predicate, descriptor: Descriptor = new Descriptor()) {
		const { property, operator, operand } = block;
		descriptor.push(`${Properties[property]?.label || property} `);
		if (block.not) {
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
		return descriptor;
	}

	private static addOperandDescriptionNodes(property: Property, operandItem: any, descriptor: Descriptor): void {
		const type = Properties[property].type;
		const entityType = SpecialEntityTypes.find(t => type.includes(t)); // Transaction.merchant_id -> merchant_id
		if (entityType) {
			descriptor.push({ type: entityType, id: operandItem });
		} else {
			descriptor.push(JSON.stringify(operandItem));
		}
	}

	public static extractPredicates(filter: FilterBlock): Predicate[] {
		const predicates: Predicate[] = [];
		const extract = (block: FilterBlock) => {
			if (block === null) {
				return;
			}
			if ('AND' in block) {
				block.AND.forEach(extract);
			} else if ('OR' in block) {
				block.OR.forEach(extract);
			} else if (Array.isArray(block)) {
				block.forEach(extract);
			} else {
				predicates.push(block);
			}
		};
		if (filter) {
			extract(filter);
		}
		return predicates;
	}

	public static combineFilters(filterA: FilterBlock, filterB: FilterBlock): FilterBlock {
		if (!filterA) return filterB;
		if (!filterB) return filterA;

		// If both are AND blocks, merge their contents
		if ('AND' in filterA && 'AND' in filterB) {
			return { AND: [...filterA.AND, ...filterB.AND] };
		}
		// If one is an AND block, add the other as a new condition
		else if ('AND' in filterA) {
			return { AND: [...filterA.AND, filterB] };
		} else if ('AND' in filterB) {
			return { AND: [filterA, ...filterB.AND] };
		}
		// Neither are AND blocks, create a new AND block
		else {
			return { AND: [filterA, filterB] };
		}
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
		const transaction = obj.sourceTransaction || obj.attributionDetails.sourceTransaction;
		if (!(transaction)) {
			return null;
		}
		return getPropertyByPath(transaction, property);
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
	'Transaction.original_description': { label: 'Description', type: 'string' },
	'amount': { label: 'Amount', type: 'currency' },
	'category_id': { label: 'Category', type: 'category_id', allowedOperators: ['eq', 'in'] },
	'Category.type': { label: 'Category Type', type: 'Category.type', allowedOperators: ['eq', 'in'] },
	'budget_id': { label: 'Budget', type: 'budget_id', allowedOperators: ['eq'] },
	'group_id': { label: 'Group', type: 'group_id', allowedOperators: ['eq'] },
	// 'merchant_id': { label: 'Merchant', type: 'merchant', allowedOperators: ['eq'] },
	'Transaction.merchant_id': { label: 'Merchant', type: 'merchant_id', allowedOperators: ['eq'] },

	'account_id': { label: 'Account', type: 'account_id', allowedOperators: ['eq'] },
	'origin_account_id': { label: 'Origin Account', type: 'origin_account_id', allowedOperators: ['eq'] },
	'account_partition_id': { label: 'Partition', type: 'account_partition_id', allowedOperators: ['eq'] },
	'origin_account_partition_id': { label: 'Origin Partition', type: 'origin_account_partition_id', allowedOperators: ['eq'] },

	'date': { label: 'Date', type: 'date' },
	'year': { label: 'Year', type: 'year' },
	'month': { label: 'Month', type: 'month' },
	'day': { label: 'Day', type: 'day' },
} as const;
export type Property = keyof typeof Properties;