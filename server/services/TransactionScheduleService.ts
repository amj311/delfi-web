import { TransactionSchedule } from "@prisma/client";
import { prisma } from "../../prisma/client";

export const TransactionScheduleService = {
    async createTransactionSchedule(user_id: string, transactionScheduleData: Omit<TransactionSchedule, 'transaction_schedule_id'>) {
        return await prisma.transactionSchedule.create({
            data: {
                ...transactionScheduleData,
                user_id,
            },
        });
    },

    async getAllTransactionSchedules(user_id: string) {
        return await prisma.transactionSchedule.findMany({
            where: {
                user_id,
            },
        });
    },

    async getTransactionScheduleById(user_id: string, transaction_schedule_id: string) {
        return await prisma.transactionSchedule.findUnique({
            where: {
                transaction_schedule_id,
                user_id,
            },
        });
    },

    async updateTransactionSchedule(user_id: string, transaction_schedule_id: string, transactionScheduleData: Partial<TransactionSchedule>) {
        return await prisma.transactionSchedule.update({
            where: {
                transaction_schedule_id,
                user_id,
            },
            data: transactionScheduleData,
        });
    },

    async deleteTransactionSchedule(user_id: string, transaction_schedule_id: string) {
        await prisma.transactionSchedule.delete({
            where: {
                transaction_schedule_id,
                user_id,
            },
        });
    },
};