import type { Budget } from "delfi-core/models/Budget";
import { prisma } from "../../prisma/client";
import { TestDataService } from "./TestDataService";

export const PlannedTransactionService = {
    async createPlannedTransaction(workspace_id: string, plannedTransactionData: Omit<Budget, 'budget_id' | 'workspace_id'>) {
        return await prisma.budget.create({
            data: {
                ...plannedTransactionData,
                workspace_id,
            },
        });
    },

    async getAllPlannedTransactions(workspace_id: string) {
        return (await prisma.budget.findMany({
            where: {
                workspace_id,
            },
        })).concat(await TestDataService.getScheduledTransactions() as any);
    },

    async getPlannedTransactionById(workspace_id: string, budget_id: string) {
        const transaction = await prisma.budget.findUnique({
            where: {
                budget_id,
                workspace_id,
            },
        });
		transaction!.type;
		return transaction;
    },

    async updatePlannedTransaction(workspace_id: string, budget_id: string, plannedTransactionData: Partial<PlannedTransactionDbInput>) {
		return await prisma.budget.update({
            where: {
                budget_id,
                workspace_id,
            },
            data: {
				memo: plannedTransactionData.memo,
				type: plannedTransactionData.type,
				recurrence_type: plannedTransactionData.recurrence_type,
				schedule: plannedTransactionData.schedule,
				trigger: plannedTransactionData.trigger,
				amount: plannedTransactionData.amount,
				account_id: plannedTransactionData.account_id,
				target_account_partition_id: plannedTransactionData.target_account_partition_id,
				origin_account_id: plannedTransactionData.origin_account_id,
				origin_account_partition_id: plannedTransactionData.origin_account_partition_id,
				category_id: plannedTransactionData.category_id,
			}
        });
    },

    async deletePlannedTransaction(workspace_id: string, budget_id: string) {
        await prisma.budget.delete({
            where: {
                budget_id,
                workspace_id,
            },
        });
    },
};