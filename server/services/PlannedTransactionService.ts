import { prisma } from "../../prisma/client";
import { my_scheduledTransactions } from "./myData";

export const PlannedTransactionService = {
    async createPlannedTransaction(user_id: string, plannedTransactionData: Omit<PlannedTransactionDbInput, 'budget_id' | 'user_id'>) {
        return await prisma.budget.create({
            data: {
                ...plannedTransactionData,
                user_id,
            },
        });
    },

    async getAllPlannedTransactions(user_id: string) {
        return (await prisma.budget.findMany({
            where: {
                user_id,
            },
        })).concat(my_scheduledTransactions as any);
    },

    async getPlannedTransactionById(user_id: string, budget_id: string) {
        const transaction = await prisma.budget.findUnique({
            where: {
                budget_id,
                user_id,
            },
        });
		transaction!.type;
		return transaction;
    },

    async updatePlannedTransaction(user_id: string, budget_id: string, plannedTransactionData: Partial<PlannedTransactionDbInput>) {
		return await prisma.budget.update({
            where: {
                budget_id,
                user_id,
            },
            data: {
				memo: plannedTransactionData.memo,
				type: plannedTransactionData.type,
				recurrence_type: plannedTransactionData.recurrence_type,
				schedule: plannedTransactionData.schedule,
				trigger: plannedTransactionData.trigger,
				amount: plannedTransactionData.amount,
				target_account_id: plannedTransactionData.target_account_id,
				target_account_partition_id: plannedTransactionData.target_account_partition_id,
				origin_account_id: plannedTransactionData.origin_account_id,
				origin_account_partition_id: plannedTransactionData.origin_account_partition_id,
				category_id: plannedTransactionData.category_id,
			}
        });
    },

    async deletePlannedTransaction(user_id: string, budget_id: string) {
        await prisma.budget.delete({
            where: {
                budget_id,
                user_id,
            },
        });
    },
};