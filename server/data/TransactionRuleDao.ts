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

		console.log("Upserting rule", data);

		return await prisma.transactionRule.upsert({
			where: {
				workspace_id: workspace_id,
				transaction_rule_id: data.transaction_rule_id,
			},
			create: {
				workspace_id: workspace_id,
				transaction_rule_id: data.transaction_rule_id,
				filter: data.filter,
				actions: {
					create: data.actions.map(action => ({
						action: action.action,
						value: action.value,
					})),
				}
			},
			update: {
				filter: data.filter,
				actions: {
					deleteMany: {
						transaction_rule_id: data.transaction_rule_id,
					}, // Delete all existing actions
					createMany: {
						data: data.actions.map(action => ({
							transaction_rule_action_id: uuid(),
							action: action.action,
							value: action.value,
						}))
					},
				}
			},
		});
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
		await prisma.transactionRule.delete({
			where: {
				workspace_id: workspace_id,
				transaction_rule_id: transactionRuleId,
			},
		});
	},
};