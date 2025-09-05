/**
 * Transaction Rules are system- and user-defined rules that apply changes to transactions that match a certain filter.
*/
import type { TransactionFilter } from "delfi-core/models/Filters";

export type TransactionRule = {
	transaction_rule_id: string,
	workspace_id?: string | null, // If not set, this rule applies globally
	filter: TransactionFilter,
	actions: Array<Action>,
	defs?: RuleDef
}

type Action = {
	/** Either a Transaction property or more complicated action */
	/** Can be path to nested property, i.e. a Transaction Memo */
	action: string,
	/** Either the value to set or a more complex configuration for the action */
	value: string,
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

export const PrettyActions = {
	'merchant_id': 'Merchant',
	'category_id': 'Category',
	'account_attribution_id': 'Account Attribution',
	'budget_id': 'Budget'
}