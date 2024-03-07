import { Account } from "../../models/types";
import { prisma } from "../../prisma/client";
import { my_accounts } from "./myData";

export const AccountService = {
    async createAccount(user_id: string, accountData: Omit<Account, 'account_id' | 'partitions'>) {
        return await prisma.account.create({
            data: {
                ...accountData,
				user_id,
				partitions: undefined,
				savings_goal: undefined,
            },
        });
    },

	// gets all parent accounts for user, with children nested
    async getAllAccounts(user_id: string): Promise<Account[]>  {
        const accounts: any[] = await prisma.account.findMany({
            where: {
                user_id,
            },
			include: {
				partitions: true,
				savings_goal: true,
			}
        });
		return accounts.concat(Object.values(my_accounts))
    },

    async getAccountById(user_id: string, accountId: string) {
        return await prisma.account.findUnique({
            where: {
                account_id: accountId,
                user_id,
            },
        });
    },

    async updateAccount(user_id: string, accountId: string, accountData) {
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
