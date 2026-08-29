import type { Account } from "delfi-core/models/Account";
import { prisma } from "../../prisma/client";
import type { CreateAccountData } from "server/services/AccountService";

export const AccountDao = {
	dbToAccount(dbAccount: NonNullable<{ [key: string]: any }>): Account {
		return {
			...dbAccount,
			mostRecentTransaction: dbAccount.Transaction?.[0] || null,
		} as Account;
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

			archived: account.archived,
		}
	},
	
    async createAccount(workspace_id: string, accountData: CreateAccountData) {
        const created = await prisma.account.create({
            data: {
				...this.commonAccountToDb(accountData),

				Workspace: {
					connect: { workspace_id },
				},
				Institution: {
					connect: { institution_id: accountData.institution_id },
				}
            },
        });
		return this.dbToAccount(created);
    },

	// gets all parent accounts for workspace, with children nested
    async getAllAccounts(workspace_id: string): Promise<Account[]>  {
        const accounts: any[] = await prisma.account.findMany({
            where: {
                workspace_id,
				archived: false,
			},
			include: {
				partitions: true,
				savings_goal: true,
				Institution: true,
				// include the most recent transaction
				Transaction: {
					take: 1,
					orderBy: {
						date: 'desc'
					}
				}
			}
        });
        return accounts.map(a => this.dbToAccount(a));
    },

    async getAccountById(workspace_id: string, accountId: string) {
        return await prisma.account.findUnique({
            where: {
                account_id: accountId,
                workspace_id,
            },
        });
    },


	async matchAll(search: Partial<Account>): Promise<Account | null> {
		const found = await prisma.account.findFirst({
			where: {
				AND: Object.entries(search).map(([key, value]) => ({ [key]: value })),
			},
		});
		return found ? this.dbToAccount(found) : null;
	},

	async getMatchingAccount(workspace_id: string, institutionId: string, externalId: string) {
		const found = await prisma.account.findFirst({
			where: {
				external_account_id: externalId,
				workspace_id,
				institution_id: institutionId,
			},
		});
		return found ? this.dbToAccount(found) : null;
	},

    async updateAccount(workspace_id: string, accountId: string, accountData) {
		return this.dbToAccount(await prisma.account.update({
            where: {
                account_id: accountId,
                workspace_id,
            },
            data: accountData,
        }));
    },

    async deleteAccount(workspace_id: string, accountId: string) {
        await prisma.account.delete({
            where: {
                account_id: accountId,
                workspace_id,
            },
        });
    },
};
