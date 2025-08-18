import type { TransactionRule } from "delfi-core/models/TransactionRule";
import { prisma } from "../../prisma/client";
import { TestDataService } from "server/services/TestDataService";

export const TransactionRuleDao = {
	async createTransactionRule(data: Omit<TransactionRule, 'transaction_rule_id'>) {
		return await prisma.transactionRule.create({
			data,
		});
	},

	async getWorkspaceRules(workspace_id?: string) {
		// return await prisma.transactionRule.findMany({
		// 	where: {
		// 		workspace_id: workspace_id,
		// 	},
		// });
		return TestDataService.transactionRules;
	},

	async getGlobalRules() {
		// return await prisma.transactionRule.findMany({
		// 	where: {
		// 		workspace_id: null,
		// 	},
		// });
		return [];
	},

	async getTransactionRuleById(transactionruleId: string) {
		return await prisma.transactionRule.findUnique({
			where: {
				transaction_rule_id: transactionruleId,
			},
		});
	},

	async updateTransactionRule(transactionruleId: string, data: Partial<TransactionRule>) {
		return await prisma.transactionRule.update({
			where: {
				transaction_rule_id: transactionruleId,
			},
			data,
		});
	},

	async deleteTransactionRule(transactionruleId: string) {
		await prisma.transactionRule.delete({
			where: {
				transaction_rule_id: transactionruleId,
			},
		});
	},
};