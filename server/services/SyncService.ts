import dayjs from "dayjs";
import { AccountService } from "./AccountService";
import { JobService } from "./JobService";
import { ScraperService } from "./scraper/ScraperService";
import { TransactionService } from "./TransactionService";
import { WorkspaceDao } from "server/data/WorkspaceDao";
import type { CreateTransaction, Transaction, TransactionDetails } from "delfi-core/models/Transaction";
import type { AccountDetails } from "delfi-core/models/Account";
import type { CategoryKey } from "delfi-core/models/systemCategories";
import { CategoryDao } from "server/data/CategoryDao";

export type SyncedTransactionDetails = CreateTransaction & {
	/** Incoming transaction may have default categories supplied by scrapers */
	category_key?: CategoryKey;
	account_id?: string; // will be filled in during sync
}

type AccountSyncFailed = {
	account_id: string;
	error: string;
}
type AccountSyncSuccess = {
	account_id: string;
	accountDetails: AccountDetails;
	transactions: Array<SyncedTransactionDetails>;
}
export type AccountSyncResult = AccountSyncFailed | AccountSyncSuccess;


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

		// filter out different sync sources
		const scraperAccounts = workspaceAccounts.filter(account => account.Institution?.scraper === 'scraper');
		const scrapeResults = await ScraperService.scrapeWorkspaceAccounts(workspace_id, scraperAccounts);

		await this.ingestAccountSyncs(workspace_id, scrapeResults);
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


	public static async ingestAccountSyncs(workspace_id: string, accountSyncs: Array<AccountSyncResult>) {
		const newTransactions: Array<Transaction> = [];
		// Update account details and sync new transactions
		await Promise.all(accountSyncs.map(async result => {
			if ('error' in result) {
				return await AccountService.updateAccount(workspace_id, result.account_id, {
					last_failed_sync: new Date(),
					sync_error: result.error || 'Unknown error',
				});
			} else {
				const transactionsWithCategories = await Promise.all(result.transactions.map(async (tx): Promise<CreateTransaction> => {
					const categoryMapping = await CategoryDao.getWorkspaceCategoryMappingByDetectionKey(workspace_id, tx.category_key);
					return {
						...tx,
						category_id: categoryMapping?.category_id || null,
					};
				}));
				const results = await TransactionService.ingestNewTransactionsForAccount(workspace_id, result.account_id, transactionsWithCategories);
				newTransactions.push(...results.upsertResults.filter(r => r.created).map(r => r.transaction));

				await AccountService.updateAccount(workspace_id, result.account_id, {
					current_balance: result.accountDetails.current_balance,
					available_balance: result.accountDetails.available_balance,
					limit: result.accountDetails.limit,
					external_name: result.accountDetails.external_name,
					apy: result.accountDetails.apy,
					apr: result.accountDetails.apr,
					last_successful_sync: new Date(),
				});

				await AccountService.recordBalance(result.account_id, result.accountDetails.current_balance);
			}
		}));

		// Once all accounts are synced, find transfer pairs for new transactions
		await TransactionService.findAndLinkTransferPairs(workspace_id, newTransactions);

		// await PlaidService.searchForPlaidTransactionData(workspace_id);
		return newTransactions;
	}
};


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