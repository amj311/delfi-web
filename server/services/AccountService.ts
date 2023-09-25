import { Account } from "@prisma/client";
import { prisma } from "../../prisma/client";

export const AccountService = {
    async createAccount(user_id: string, accountData: Omit<Account, 'account_id'>) {
        return await prisma.account.create({
            data: {
                ...accountData,
                user_id,
            },
        });
    },

    async getAllAccounts(user_id: string) {
        return await prisma.account.findMany({
            where: {
                user_id,
            },
        });
    },

    async getAccountById(user_id: string, accountId: string) {
        return await prisma.account.findUnique({
            where: {
                account_id: accountId,
                user_id,
            },
        });
    },

    async updateAccount(user_id: string, accountId: string, accountData: Partial<Account>) {
        return await prisma.account.update({
            where: {
                account_id: accountId,
                user_id,
            },
            data: accountData,
        });
    },

    async deleteAccount(user_id: string, accountId: string) {
        await prisma.account.delete({
            where: {
                account_id: accountId,
                user_id,
            },
        });
    },
};
