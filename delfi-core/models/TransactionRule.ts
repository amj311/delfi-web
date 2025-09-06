/**
 * Transaction Rules are system- and user-defined rules that apply changes to transactions that match a certain filter.
*/
import type { JsonObject } from "@prisma/client/runtime/library";
import type { TransactionFilter } from "delfi-core/models/Filters";
import type { Optional } from "delfi-core/utils/typeUtils";

export type TransactionRule = {
	transaction_rule_id: string,
	workspace_id?: string | null, // If not set, this rule applies globally
	filter: NonNullable<TransactionFilter>,
	actions: Array<Action>,
	defs?: RuleDef
}

export type TransactionRuleDraft = Optional<TransactionRule, 'transaction_rule_id'>;

export type Action = {
	/** Either a Transaction property or more complicated action */
	/** Can be path to nested property, i.e. a Transaction Memo */
	action: string,
	/** Either the value to set or a more complex configuration for the action */
	value: JsonObject,
}

type RuleDef = {
	[key: string]: {
		text: string,
		type: 'merchant' | 'category' | 'other',
		data: any,
	}
}


export class TransactionRuleUtils {
}

export const Actions = {
	'memo': {
		label: 'Set Memo',
		form: [{
			key: 'memo',
			label: 'Memo',
			placeholder: 'Enter memo',
			type: 'string',
		}],
	},
	'merchant_id': {
		label: 'Set Merchant',
		form: [{
			key: 'merchant_id',
			label: 'Merchant',
			type: 'merchant',
		}]
	},
	'category_id': {
		label: 'Set Category',
		form: [{
			key: 'category_id',
			label: 'Category',
			type: 'category',
		}]
	},
	'budget_id': {
		label: 'Set Budget',
		form: [{
			key: 'budget_id',
			label: 'Budget',
			type: 'budget',
		}]
	},
} as const;

export type ActionType = keyof typeof Actions;