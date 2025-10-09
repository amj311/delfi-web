import type { Category } from "delfi-core/models/Category";
import { TransactionUtils, type Transaction, type TransactionAttribution } from "delfi-core/models/Transaction";
import { type TransactionRule } from "delfi-core/models/TransactionRule";
import FilterUtils from "delfi-core/models/Filters";
import { nullOrUndefined } from "delfi-core/utils/miscUtils";
import { BudgetDao } from "server/data/BudgetDao";
import { TransactionDao } from "server/data/TransactionDao";
import { TransactionRuleDao } from "server/data/TransactionRuleDao";
import { CategoryService } from "./CategoryService";

export class TransactionRuleService {
	public static async applyRulesToTransactions(workspace_id: string, transactions: Transaction[]) {
		const workspaceRules = await TransactionRuleDao.getWorkspaceRules(workspace_id);
		const globalRules = await TransactionRuleDao.getGlobalRules();

		// sort the rules sets so that CUSTOM actions are applied first, so that other user-rules can overwrite any
		// properties set by the global rules.
		// EG Merchant rules could set both a merchant and a category, but a later rule may want to change the category.
		// The category rule/action should apply last, so it can override the category set by the merchant rule.
		[workspaceRules, globalRules].forEach(rules => rules.sort((a, b) => a.actions.some(c => c.action in CustomActions) ? -1 : 1).forEach(rule => {
			rule.actions.sort((a, b) => a.action in CustomActions ? -1 : 1);
		}));

		await Promise.all(transactions.map(async (transaction) => {
			// global rules pretty much only exist to auto-select merchants and categories. Workspace rules may depend on these being set already...
			// The user is not intended to know about global rules, they will just see them as internal magic that happens when a transaction is created
			// They will write their rules based on the properties they expect to already be set by global rules
			await this.applyRuleSetToTransaction(transaction, globalRules as any);
			await this.applyRuleSetToTransaction(transaction, workspaceRules as any);
			await TransactionDao.patchTransaction(workspace_id, transaction.transaction_id, transaction);
		}));
	}

	/**
	 * Finds all workspace rules that would apply to the given transaction
	 */
	public static async getApplicableRules(workspace_id: string, transaction_id: string) {
		const transaction = await TransactionDao.getTransactionById(transaction_id);
		if (!transaction) {
			throw new Error(`Transaction with ID ${transaction_id} not found`);
		}
		const workspaceRules = await TransactionRuleDao.getWorkspaceRules(workspace_id);
		const attributionEvents = TransactionUtils.processAttributionEvents([transaction]);
		return workspaceRules.filter(rule => {
			return attributionEvents.some(event => FilterUtils.matches(rule.filter as any, event));
		});
	}

	private static async applyRuleSetToTransaction(transaction: Transaction, rules: TransactionRule[]) {
		// Rules may set properties that then trigger another rule, like setting a Merchant and then triggering a rule that sets a Category based on the Merchant.
		// So we need to loop through the rules until no more changes are made, or a maximum number of iterations is reached.
		let iterations = 0;
		const maxIterations = 10; // Prevent infinite loops
		let changed = true;

		while (changed && iterations < maxIterations) {
			changed = false;
			for (const rule of rules) {
				// Many attributes are applied at the attribution level, and filters can process attributions as well
				// There should only be one attribution on new transactions, but this might be used on existing ones, or maybe
				// an automatic split was created in a previous rule.
				for (const attribution of transaction.Attributions) {
					// Create AttributionEvent for filtering as it is is easier to filter on
					if (!FilterUtils.matches(rule.filter, TransactionUtils.createEventFromAttribution(attribution, transaction))) {
						continue; // Rule does not match this attribution
					}

					await Promise.all(rule.actions.map(async (change) => {
						changed = await TransactionRuleService.applyAction(attribution, transaction, change) || changed;
					}));
				}
			}
			iterations++;
		}

		return transaction;
	}

	private static async applyAction(attribution: TransactionAttribution, transaction: Transaction, change: TransactionRule["actions"][number]): Promise<boolean> {
		let changed = false;
		// handle custom actions first, otherwise set property
		if (change.action in CustomActions) {
			// the action will determine if it has changed the attribution
			await CustomActions[change.action](attribution, transaction, change.value);
		}
		// attempt to set property on attribution or transaction
		else if (change.action in attribution) {
			changed = true;
			// attribution.example = change.value.example;
			attribution[change.action] = change.value[change.action];
		}
		else if (change.action in transaction) {
			changed = true;
			// transaction.example = change.value.example;
			transaction[change.action] = change.value[change.action];
		}
		return changed;
	}
};


const CustomActions: Record<string, (attribution: TransactionAttribution, transaction: Transaction, value: any) => Promise<boolean>> = {
	// If a merchant is set by any rule, checks if it has a determines which workspace category to use for that merchant, if any
	merchant_id: async (attribution: TransactionAttribution, transaction: Transaction, value: { merchant_id: string }) => {
		if (transaction.merchant_id || !value.merchant_id) {
			return false; // Cannot set merchant
		}

		const categoryAssociation = await CategoryService.getMerchantCategory(transaction.workspace_id, value.merchant_id);
		transaction.merchant_id = value.merchant_id;
		attribution.category_id = categoryAssociation?.category_id || null;
		attribution.Category = categoryAssociation?.Category as Category || undefined;

		return true; // at the very least the merchant_id was set, so we return true
	},


	// If a rule sets a budget, the attribution should inherit the budget-able properties of the budget
	budget_id: async (attribution: TransactionAttribution, transaction: Transaction, value: { budget_id: string }) => {
		if (attribution.budget_id || !value.budget_id) {
			return false; // Cannot set budget
		}

		// Lookup the budget to copy its properties
		const budget = await BudgetDao.getBudgetById(transaction.workspace_id, value.budget_id);
		if (!budget) {
			console.warn(`Budget with ID ${value.budget_id} not found`);
			return false; // Budget not found
		}

		attribution.budget_id = value.budget_id;

		for (const prop of ["category_id", "group_id", "target_account_partition_id"]) {
			if (budget[prop] && nullOrUndefined(attribution[prop])) {
				attribution[prop] = budget[prop];
			}
		}

		return true;
	},
}

// const att = {} as TransactionAttribution;
// const tx = { workspace_id: TestDataService.workspaceId } as Transaction;
// CustomActions.merchant_id(att, tx, 'd1a7ff54-1234-450b-b7c8-cb02828a7efe').catch(console.error).then(() => {
// 	console.log('Custom action applied:', att, tx);
// });
