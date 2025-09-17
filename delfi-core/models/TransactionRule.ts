/**
 * Transaction Rules are system- and user-defined rules that apply changes to transactions that match a certain filter.
*/
import Descriptor, { SpecialEntityTypes } from "delfi-core/utils/Descriptor";
import type { JsonObject } from "@prisma/client/runtime/library";
import type { TransactionFilter } from "delfi-core/models/Filters";
import FilterUtils from "delfi-core/models/Filters";
import type { Optional } from "delfi-core/utils/typeUtils";
import type { AttributionEvent } from "./Transaction";

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
			type: 'merchant_id',
		}]
	},
	'category_id': {
		label: 'Set Category',
		form: [{
			key: 'category_id',
			label: 'Category',
			type: 'category_id',
		}]
	},
	'budget_id': {
		label: 'Set Budget',
		form: [{
			key: 'budget_id',
			label: 'Budget',
			type: 'budget_id',
		}]
	},
} as const;

export type ActionType = keyof typeof Actions;
export const ActionTypes = Object.keys(Actions) as ActionType[];


export class TransactionRuleUtils {
	public static ruleDescription(rule: TransactionRule) {
		// Find action defs
		const actions = rule.actions.map(this.actionDescription);

		return {
			filterDescriptor: FilterUtils.describeFilter(rule.filter),
			actions,
		};
	}

	public static actionDescription(action: Action) {
		const descriptor = new Descriptor();
		const entityType = SpecialEntityTypes.find(t => t === action.action);
		if (entityType) {
			descriptor.push({ type: entityType, id: action.value[action.action] as string }); // action.value is { category_id: '...' }
		} else {
			descriptor.push(JSON.stringify(action.value[action.action])); // action.value is { memo: 'New memo' }	
		}

		return {
			verb: Actions[action.action].verb || '',
			target: Actions[action.action]?.label || action.action,
			// TODO this will not match more complex action values
			valueDescriptor: descriptor,
		}
	}

	public static extractActionValueFromEvent(action: ActionType, event: AttributionEvent): any {
		const actionDef = Actions[action];
		if ('getValueFromEvent' in actionDef) {
			return (actionDef as any).getValueFromEvent(event);
		}
		let value: any = '';
		if (action in event) {
			value = event[action as keyof AttributionEvent];
		}
		if (action in event.attributionDetails) {
			value = event.attributionDetails[action as keyof AttributionEvent['attributionDetails']];
		}
		if (action in event.attributionDetails.sourceTransaction) {
			value = event.attributionDetails.sourceTransaction[action as keyof AttributionEvent['attributionDetails']['sourceTransaction']];
		}
		return value ? { [action]: value } : null;
	}
}
