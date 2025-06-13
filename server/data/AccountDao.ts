import type { Account } from "delfi-core/models/Account";
import { prisma } from "../../prisma/client";
import { my_accounts } from "../services/myData";
import type { CreateAccountData } from "server/services/AccountService";

export const AccountDao = {
	dbToAccount(dbAccount: any): Account | undefined {
		if (!dbAccount) return undefined;
		return {
			...dbAccount,
		}
	},

	commonAccountToDb(account: CreateAccountData) {
		return {
			display_name: account.display_name,
			external_name: account.external_name,
			external_account_id: account.external_account_id,
			type: account.type,
			subtype: account.subtype,
			mask: account.mask,
			apy: account.apy,
			iso_currency_code: account.iso_currency_code,
			current_balance: account.current_balance,
			available_balance: account.available_balance,
			limit: account.limit,
			
			source: account.source,
			source_id: account.source_id,
			source_data: account.source_data,

			last_successful_sync: account.last_successful_sync,
			last_failed_sync: account.last_failed_sync,
			sync_error: account.sync_error,
		}
	},
	
    async createAccount(user_id: string, accountData: CreateAccountData) {
        const created = await prisma.account.create({
            data: {
				...this.commonAccountToDb(accountData),

				User: {
					connect: { user_id },
				},
				Institution: {
					connect: { institution_id: accountData.institution_id },
				}
            },
        });
		return this.dbToAccount(created);
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
		// return accounts.concat(Object.values(my_accounts))
		return accounts;
    },

    async getAccountById(user_id: string, accountId: string) {
        return await prisma.account.findUnique({
            where: {
                account_id: accountId,
                user_id,
            },
        });
    },

	async getMatchingAccount(user_id: string, institutionId: string, externalId: string) {
		return this.dbToAccount(await prisma.account.findFirst({
			where: {
				external_account_id: externalId,
				user_id,
				institution_id: institutionId,
			},
		}));
	},

    async updateAccount(user_id: string, accountId: string, accountData) {
		return this.dbToAccount(await prisma.account.update({
            where: {
                account_id: accountId,
                user_id,
            },
            data: accountData,
        }));
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
