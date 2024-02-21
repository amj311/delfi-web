import { PlannedTransaction, PlannedTransactionDbInput } from "../../models/types";
import { prisma } from "../../prisma/client";
import { my_scheduledTransactions } from "./myData";

export const PlannedTransactionService = {
    async createPlannedTransaction(user_id: string, plannedTransactionData: Omit<PlannedTransactionDbInput, 'planned_transaction_id' | 'user_id'>) {
        return await prisma.plannedTransaction.create({
            data: {
                ...plannedTransactionData,
                user_id,
            },
        });
    },

    async getAllPlannedTransactions(user_id: string) {
        // return await prisma.plannedTransaction.findMany({
        //     where: {
        //         user_id,
        //     },
        // });
		return my_scheduledTransactions;
    },

    async getPlannedTransactionById(user_id: string, planned_transaction_id: string) {
        const transaction = await prisma.plannedTransaction.findUnique({
            where: {
                planned_transaction_id,
                user_id,
            },
        });
		transaction!.type;
		return transaction;
    },

    async updatePlannedTransaction(user_id: string, planned_transaction_id: string, plannedTransactionData: Partial<PlannedTransactionDbInput>) {
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