import type { TransactionRule } from "delfi-core/models/TransactionRule";
import { prisma } from "../../prisma/client";
import { TestDataService } from "server/services/TestDataService";
import type { Optional } from "delfi-core/utils/typeUtils";
import { v4 as uuid } from "uuid";

export const TransactionRuleDao = {
	hasInit: false,
	async setupTestData() {
		if (this.hasInit) return;
		this.hasInit = true;
		for (const rule of TestDataService.transactionRules) {
			await this.upsertTransactionRule(TestDataService.workspaceId, rule);
		}
	},

	async upsertTransactionRule(workspace_id, data: Optional<TransactionRule, 'transaction_rule_id'>) {
		await this.setupTestData();
		for (const action of data.actions) {
			if (!action.action) {
				throw new Error("Action type is required");
			}
		}
		if (!data.filter) {
			throw new Error("Filter is required");
		}

		const existingRule = data.transaction_rule_id && (await prisma.transactionRule.findUnique({
			where: {
				transaction_rule_id: data.transaction_rule_id,
				OR: [
					{ workspace_id: workspace_id }, // Either specific to this workspace
					{ workspace_id: null }, // Or global
				]
			},
			include: {
				actions: true,
			}
		}));

		if (!existingRule) {
			return await prisma.transactionRule.create({
				data: {
					workspace_id: workspace_id,
					filter: data.filter,
					actions: {
						create: data.actions.map(action => ({
							action: action.action,
							value: action.value,
						})),
					}
				},
				include: { actions: true },
			});
		} else {
			// First, delete existing actions
			await prisma.transactionRuleAction.deleteMany({
				where: {
					transaction_rule_id: data.transaction_rule_id,
				},
			});

			// Then, update the rule and create new actions
			return await prisma.transactionRule.update({
				where: {
					transaction_rule_id: data.transaction_rule_id,
				},
				data: {
					filter: data.filter,
					actions: {
						create: data.actions.map(action => ({
							action: action.action,
							value: action.value,
						})),
					}
				},
				include: {
					actions: true,
				},
			});
		}
	},

	async getWorkspaceRules(workspace_id?: string) {
		await this.setupTestData();

		return await prisma.transactionRule.findMany({
			where: {
				workspace_id: workspace_id,
			},
			include: {
				actions: true,
			}
		});
	},

	async getGlobalRules() {
		// return await prisma.transactionRule.findMany({
		// 	where: {
		// 		workspace_id: null, // workspace MUST be null or we get workspace-specific rules
		// 	},
		// });
		return [];
	},

	async deleteTransactionRule(workspace_id: string, transactionRuleId: string) {
		await prisma.transactionRuleAction.deleteMany({
			where: {
				transaction_rule_id: transactionRuleId,
			},
		});

		await prisma.transactionRule.delete({
			where: {
				workspace_id: workspace_id,
				transaction_rule_id: transactionRuleId,
			},
		});
	},
};