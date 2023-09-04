import { Account } from "@prisma/client";
import { prisma } from "../prisma/client";

export const PlaidService = {
	async createAccount(accountData: Omit<Account, 'account_id'>)  {
		return await prisma.account.create({
			data: accountData,
		})
	}
};
