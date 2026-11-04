import dayjs from "dayjs";
import { AccountService } from "./AccountService";
import { JobService } from "./JobService";
import { ScraperService } from "./scraper/ScraperService";
import { TransactionService } from "./TransactionService";
import { WorkspaceDao } from "server/data/WorkspaceDao";
import { TransactionUtils, type CreateTransaction, type Transaction } from "delfi-core/models/Transaction";
import type { AccountDetails } from "delfi-core/models/Account";
import type { CategoryKey } from "delfi-core/models/systemCategories";
import { CategoryDao } from "server/data/CategoryDao";
import { ddate, type DelfiDate } from "delfi-core/utils/dateUtils";
import { peek } from "delfi-core/utils/miscUtils";
import { NotificationService } from "./NotificationService";
import { numberToDollars } from "./scraper/ScraperUtils";
import { hasInjectionContext } from "vue";

export type SyncedTransactionDetails = CreateTransaction & {
	/** Incoming transaction may have default categories supplied by scrapers */
	category_key?: CategoryKey;
	account_id?: string; // will be filled in during sync
}

type YYYYMMDD = `${number}-${number}-${number}`;

type RawSyncedTransaction = Omit<SyncedTransactionDetails, 'date'> & {
	date: YYYYMMDD | DelfiDate;
}

type AccountSyncFailed = {
	account_id: string;
	error: string;
}
type AccountSyncSuccess = {
	account_id: string;
	accountDetails: AccountDetails;
	transactions: Array<RawSyncedTransaction>;
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

	public static async syncWorkspaceAccounts(workspace_id: string, ids?: string[]) {
		console.log(`\n\nSyncing accounts for workspace: ${workspace_id}`);
		const workspaceAccounts = (await AccountService.getAllAccounts(workspace_id)).filter(account => !ids || ids.includes(account.account_id));

		// filter out different sync sources
		const scraperAccounts = workspaceAccounts.filter(account => account.Institution?.scraper === 'scraper');
		const scrapeResults = await ScraperService.scrapeWorkspaceAccounts(workspace_id, scraperAccounts);

		return await this.ingestAccountSyncs(workspace_id, scrapeResults);
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

	/**
	 * NOTE: This does some actions based on the ENTIRE set of new transactions,
	 * assuming that they represent all transactions from the source account for that time period.
	 * DO NOT call this function with a subset of transactions
	 * @param workspace_id 
	 * @param accountSyncs 
	 * @returns 
	 */
	public static async ingestAccountSyncs(workspace_id: string, accountSyncs: Array<AccountSyncResult>) {
		console.log("Processing incoming account syncs");
		const ingestionResults = {
			failedAccounts: [] as Array<{
				account_id: string,
				errorText: string,
			}>,
			newTransactions: [] as Array<Transaction>,
		}

		async function recordAccountSyncFailure(workspace_id: string, account_id: string, error) {
			const account = await AccountService.getAccountById(workspace_id, account_id);
			const lastSuccess = account?.last_successful_sync;

			const errorText = error?.message || error || 'Unknown error';

			if (lastSuccess) {
				// don't report every single failure
				// some fail on fluke scrape timeouts and then succeed next time.
				// consider detecting retry cases
				const reportFailureDays = [1, 7];
				const hoursSinceSuccess = Math.floor((Date.now() - lastSuccess.getTime()) / 3600000);
				console.log("FAILED HOURS!", hoursSinceSuccess)
				if (reportFailureDays.some(d => hoursSinceSuccess === d * 24)) {
					await NotificationService.notifyWorkspace(workspace_id, {
						subject: "Failed to sync account!",
						textBody:
	`Sync has been failing for account ${account.external_name} for ${hoursSinceSuccess / 24} days./

	Latest cause: ${errorText}.`,
					})
				}
			}

			ingestionResults.failedAccounts.push({
				account_id,
				errorText,
			})

			await AccountService.updateAccount(workspace_id, account_id, {
				last_failed_sync: new Date(),
				sync_error: errorText,
			});
		}

		// Update account details and sync new transactions
		await Promise.all(accountSyncs.map(async result => {
			if ('error' in result) {
				await recordAccountSyncFailure(workspace_id, result.account_id, result.error);
			} else {
				try {
					// Hydrate data from sync
					let parsedTransactions: Array<SyncedTransactionDetails> = result.transactions.map(tx => ({ ...tx, date: ddate(tx.date) }));
					// First, assign date orders to incoming transactions. When doing so, make sure to preserve any existing date orders.
					// THE TRANSACTIONS MUST BE A COMPLETE SET OF ALL TRANSACTIONS FOR THE DATES INVOLVED
					parsedTransactions = TransactionUtils.assignDateOrders(parsedTransactions);

					// handle cleaning up stale transactions.
					// Some bank portals will shift the data of a transaction within a few days of it posting
					// This process makes sure that we don't duplicate transactions when this happens.
					// Essentially, any transaction must remain unchanged for a few days to stick in our DB
					await TransactionService.removeGhostTransactionsFromSync(workspace_id, result.account_id, parsedTransactions);

					const transactionsWithCategories = await Promise.all(parsedTransactions.map(async (tx): Promise<CreateTransaction> => {
						const categoryMapping = await CategoryDao.getWorkspaceCategoryMappingByDetectionKey(workspace_id, tx.category_key);
						return {
							...tx,
							category_id: categoryMapping?.category_id || null,
						};
					}));
					const results = await TransactionService.ingestNewTransactionsForAccount(workspace_id, result.account_id, transactionsWithCategories);
					ingestionResults.newTransactions.push(...results.upsertResults.filter(r => r.created).map(r => r.transaction));

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
				catch (e) {
					console.log(e);
					await recordAccountSyncFailure(workspace_id, result.account_id, e);
				}
			}
		}));

		// Once all accounts are synced, find transfer pairs for new transactions
		await TransactionService.findAndLinkTransferPairs(workspace_id, ingestionResults.newTransactions);

		// await PlaidService.searchForPlaidTransactionData(workspace_id);
		console.log("Finished processing account syncs! New transactions:", ingestionResults.newTransactions.length);

		// Notify users!
		if (ingestionResults.newTransactions.length) {
			const displayCap = 5;
			const visibleTrans = ingestionResults.newTransactions.slice(0,displayCap);
			const remainder = Math.max(0, ingestionResults.newTransactions.length - displayCap);
			await NotificationService.notifyWorkspace(workspace_id, {
				subject: `New transactions to review`,
				textBody:
`You have ${ingestionResults.newTransactions.length} to review:

${ visibleTrans.map(tx => [ddate(tx.date).format('MM/DD/YYYY'), tx.original_description.slice(0, 30).padEnd(30), numberToDollars(tx.amount).padStart(10)].join('   ')).join('\n') }

${ remainder ? `... and ${remainder} more.` : ''} }`,
			})
		}
		return ingestionResults;
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