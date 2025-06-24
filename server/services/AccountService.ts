import type { Account } from "delfi-core/models/Account";
import { TestDataService } from "./TestDataService";
import { AccountDao } from "server/data/AccountDao";

export type CreateAccountData = Omit<Account, 'account_id' | 'partitions' | 'Institution' | 'workspace_id'>;

export class AccountService {
	public static async upsertAccount(workspace_id: string, accountData: CreateAccountData) {
		console.log("Upserting account", accountData);
		const existingAccount = await AccountDao.getMatchingAccount(workspace_id, accountData.institution_id, accountData.external_account_id);
		console.log("Existing account found:", existingAccount);
		
		if (existingAccount) {
			// Update existing account
			return await AccountDao.updateAccount(workspace_id, existingAccount.account_id, accountData);
		} else {
			// Create new account
			return await this.createAccount(workspace_id, accountData);
		}
	}
	
	private static async createAccount(workspace_id: string, accountData: CreateAccountData) {
		return await AccountDao.createAccount(workspace_id, accountData);
    }

	// gets all parent accounts for workspace, with children nested
    public static async getAllAccounts(workspace_id: string): Promise<Account[]>  {
		return await AccountDao.getAllAccounts(workspace_id)
    }

    public static async getAccountById(workspace_id: string, accountId: string) {
        return await AccountDao.getAccountById(workspace_id, accountId);
    }

    public static async updateAccount(workspace_id: string, accountId: string, accountData) {
		return await AccountDao.updateAccount(workspace_id, accountId, accountData);
    }

    public static async deleteAccount(workspace_id: string, accountId: string) {
        await AccountDao.deleteAccount(workspace_id, accountId);
    }
};
