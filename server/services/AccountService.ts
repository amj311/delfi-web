import type { Account } from "delfi-core/models/Account";
import { my_accounts } from "./myData";
import { AccountDao } from "server/data/AccountDao";

export type CreateAccountData = Omit<Account, 'account_id' | 'partitions'>;

export class AccountService {
	public static async upsertAccount(user_id: string, accountData: CreateAccountData) {
		const existingAccount = await AccountDao.getMatchingAccount(user_id, accountData.institution_id, accountData.external_account_id);
		if (existingAccount) {
			// Update existing account
			return await AccountDao.updateAccount(user_id, existingAccount.account_id, accountData);
		} else {
			// Create new account
			return await this.createAccount(user_id, accountData);
		}
	}
	
	private static async createAccount(user_id: string, accountData: CreateAccountData) {
		return await AccountDao.createAccount(user_id, accountData);
    }

	// gets all parent accounts for user, with children nested
    public static async getAllAccounts(user_id: string): Promise<Account[]>  {
        return await AccountDao.getAllAccounts(user_id);
    }

    public static async getAccountById(user_id: string, accountId: string) {
        return await AccountDao.getAccountById(user_id, accountId);
    }

    public static async updateAccount(user_id: string, accountId: string, accountData) {
		return await AccountDao.updateAccount(user_id, accountId, accountData);
    }

    public static async deleteAccount(user_id: string, accountId: string) {
        await AccountDao.deleteAccount(user_id, accountId);
    }
};
