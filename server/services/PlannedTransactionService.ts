import { PlannedTransaction } from "@prisma/client";
import { prisma } from "../../prisma/client";

export const PlannedTransactionService = {
    async createPlannedTransaction(user_id: string, plannedTransactionData: Omit<PlannedTransaction, 'planned_transaction_id'>) {
        return await prisma.plannedTransaction.create({
            data: {
                ...plannedTransactionData,
                user_id,
            },
        });
    },

    async getAllPlannedTransactions(user_id: string) {
        return await prisma.plannedTransaction.findMany({
            where: {
                user_id,
            },
        });
    },

    async getPlannedTransactionById(user_id: string, planned_transaction_id: string) {
        return await prisma.plannedTransaction.findUnique({
            where: {
                planned_transaction_id,
                user_id,
            },
        });
    },

    async updatePlannedTransaction(user_id: string, planned_transaction_id: string, plannedTransactionData: Partial<PlannedTransaction>) {
        return await prisma.plannedTransaction.update({
            where: {
                planned_transaction_id,
                user_id,
            },
            data: plannedTransactionData,
        });
    },

    async deletePlannedTransaction(user_id: string, planned_transaction_id: string) {
        await prisma.plannedTransaction.delete({
            where: {
                planned_transaction_id,
                user_id,
            },
        });
    },
};