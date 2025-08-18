import dayjs from "dayjs";
import { AccountService } from "./AccountService";
import { JobService } from "./JobService";
import { ScraperService } from "./scraper/ScraperService";
import { TransactionService } from "./TransactionService";
import { WorkspaceService } from "./WorkspaceService";
import { PlaidService } from "./PlaidService";
import { WorkspaceDao } from "server/data/WorkspaceDao";
import { TestDataService } from "./TestDataService";

export class SyncService {
	public static async addAccountsFromInstitution(workspace_id: string, institution_id: string): Promise<void> {
		const accounts = await ScraperService.findAccountsByInstitution(workspace_id, institution_id);
		for (const account of accounts) {
			await AccountService.upsertAccount(workspace_id, {
				...account,
				created_at: new Date(),
			});
			console.log(`Added account: ${account.external_name} (${account.external_account_id})`);
		}
		await this.syncWorkspaceAccounts(workspace_id, accounts.map(account => account.external_account_id));
	}

	public static async syncWorkspaceAccounts(workspace_id: string, ids?: string[]): Promise<void> {
		console.log(`\n\nSyncing accounts for workspace: ${workspace_id}`);
		const workspaceAccounts = (await AccountService.getAllAccounts(workspace_id)).filter(account => !ids || ids.includes(account.account_id));

		const scrapeResults = await ScraperService.scrapeWorkspaceAccounts(workspace_id, workspaceAccounts);

		await Promise.all(workspaceAccounts.map(async account => {
			const result = scrapeResults[account.account_id];
			if (!result.success) {
				return await AccountService.updateAccount(workspace_id, account.account_id, {
					last_failed_sync: new Date(),
					sync_error: result.error || 'Unknown error',
				});
			}
			await AccountService.updateAccount(workspace_id, account.account_id, {
				current_balance: result.accountDetails.current_balance,
				available_balance: result.accountDetails.available_balance,
				limit: result.accountDetails.limit,
				external_name: result.accountDetails.external_name,
				apy: result.accountDetails.apy,
				last_successful_sync: new Date(),
			});
			await TransactionService.syncNewTransactionsForAccount(workspace_id, account.account_id, result.transactions);

		}));

		// await PlaidService.searchForPlaidTransactionData(workspace_id);
	}

	public static async syncAllWorkspacesAccounts(): Promise<void> {
		const allWorkspaces = await WorkspaceDao.getAllWorkspaces();
		for (const workspace of allWorkspaces) {
			try {
				await this.syncWorkspaceAccounts(workspace.workspace_id);
			} catch (error) {
				console.error(`Failed to sync accounts for workspace ${workspace.workspace_id}:`, error);
			}
		}
		console.log('Finished syncing all workspaces\' accounts');
	}
}


// QUEUE UP SYNC JOBS!
JobService.addJob({
	type: 'sync_accounts',
	schedule: {
		start: dayjs().startOf('day'),
		frequency: 'HOURLY',
		interval: 1,
	},
	handler: async () => {
		console.log(`Starting sync job for all workspaces`);
		try {
			await SyncService.syncAllWorkspacesAccounts();
			console.log(`Successfully synced accounts for all workspaces`);
		} catch (error) {
			console.error(`Error syncing accounts for all workspaces:`, error);
			throw error; // Re-throw to mark job as failed
		}
	}
})


// SyncService.addAccountsFromInstitution(TestDataService.workspaces[0].workspace_id, 'test-afcu-id')