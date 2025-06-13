import { AccountService } from "./AccountService";
import { ScraperService } from "./scraper/ScraperService";
import { TransactionService } from "./TransactionService";
import { UserService } from "./UserService";

export class SyncService {
	public static async syncUserAccounts(user_id: string): Promise<void> {
		console.log(`\n\nSyncing accounts for user: ${user_id}`);
		const userAccounts = await AccountService.getAllAccounts(user_id);

		const scrapeResults = await ScraperService.scrapeUserAccounts(user_id, userAccounts);

		await Promise.all(userAccounts.map(async account => {
			const result = scrapeResults[account.account_id];
			if (!result.success) {
				return await AccountService.updateAccount(user_id, account.account_id, {
					last_failed_sync: new Date(),
					sync_error: result.error || 'Unknown error',
				});
			}
			await AccountService.updateAccount(user_id, account.account_id, {
				current_balance: result.accountDetails.current_balance,
				available_balance: result.accountDetails.available_balance,
				limit: result.accountDetails.limit,
				external_name: result.accountDetails.external_name,
				apy: result.accountDetails.apy,
				last_successful_sync: new Date(),
			});
			console.log('Updated account:', account.account_id, result.accountDetails.external_name);
			await TransactionService.syncNewTransactionsForAccount(user_id, account.account_id, result.transactions);
			console.log('Synced transactions for account', account.account_id, result.transactions.length);
		}));
	}

	public static async syncAllUsersAccounts(): Promise<void> {
		const allUsers = await UserService.getAllUsers();
		for (const user of allUsers) {
			try {
				await this.syncUserAccounts(user.user_id);
			} catch (error) {
				console.error(`Failed to sync accounts for user ${user.user_id}:`, error);
			}
		}
		console.log('Finished syncing all users\' accounts');
	}
}