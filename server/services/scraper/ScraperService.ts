import type { TransactionDetails } from "delfi-core/models/Transaction";
import { doPageActions, useBrowser as useBrowser, type PageAction, type UsePage } from "./ScraperUtils";
import type { Page } from "playwright";
import { InstitutionService } from "../InstitutionService";
import { InstitutionScrapers } from "./InstitutionScrapers";
import type { Account, AccountDetails, Institution } from "delfi-core/models/Account";
import { TestDataService } from "../TestDataService";
import { InstitutionDao } from "server/data/InstitutionDao";
import type { AccountSyncResult, SyncedTransactionDetails } from "../SyncService";

export type ScrapedTransaction = SyncedTransactionDetails;
export type ScrapedAccount = Omit<AccountDetails, 'institution_id' | 'source'>;

export type InstitutionCredentials = {
	username?: string;
	password?: string;
}

export type InstitutionScraper = {
	hasLoggedInElement: string;
	isAtLoginElement: string;
	isLoggedOutElement: string;
	getLoginSequence: (creds: InstitutionCredentials) => PageAction[];
	listAccounts: (page: Page) => Promise<Array<ScrapedAccount>>;
	getAccountDetails: (page: Page, external_account_id: string) => Promise<ScrapedAccount>;
	getAccountTransactions: (page: Page, account: Account) => Promise<Array<ScrapedTransaction>>;
	[key: string]: any; // Allow additional properties for flexibility
}

export class ScraperService {

	/**
	 * Scrapes the institution to get details for all accounts
	*/
	public static async findAccountsByInstitution(workspace_id: string, institution_id: string): Promise<Array<AccountDetails>> {
		const scraper = InstitutionScrapers[institution_id];
		if (!scraper) {
			throw new Error(`No scraper found for institution ${institution_id}`);
		}

		const accounts: Array<AccountDetails> = [];

		await useBrowser(async (usePage) => {
			await this.logInToInstitution(usePage, institution_id, workspace_id);

			await usePage(async (page) => {
			const scrapedAccounts = await scraper.listAccounts(page);
				for (const scrapedAccount of scrapedAccounts) {
					const accountData: AccountDetails = {
						institution_id,
						external_account_id: scrapedAccount.external_account_id,
						external_name: scrapedAccount.external_name,
						current_balance: scrapedAccount.current_balance,
						available_balance: scrapedAccount.available_balance,
						limit: scrapedAccount.limit,
						type: scrapedAccount.type,
						subtype: scrapedAccount.subtype,
						iso_currency_code: scrapedAccount.iso_currency_code || 'USD',
						source: 'scraper',
						mask: scrapedAccount.mask,
						source_data: scrapedAccount,
					};
					accounts.push(accountData);
				}
			});
		});
		return accounts;
	}



	/**
	 * Efficiently scrapes the provided accounts by using the same browser instance and logging in once per institution.
	 * @param workspace_id 
	 * @param accounts 
	 * @returns 
	 */
	public static async scrapeWorkspaceAccounts(workspace_id: string, accounts: Array<Account>): Promise<Array<AccountSyncResult>> {
		// Just to be safe, make sure all accounts belong to the same user
		if (accounts.some((account) => account.workspace_id !== workspace_id)) {
			throw new Error('All accounts must belong to the same user');
		}

		return await useBrowser(async (usePage) => {
			// First log in to each institution just once
			const institutionIds = Array.from(new Set(accounts.map((account) => account.institution_id)));
			const failedLogins = new Map<string, string>();
			await Promise.all(institutionIds.map(async (institutionId) => {
				try {
					const success = await this.logInToInstitution(usePage, institutionId, workspace_id);
					if (success) {
					} else {
						throw new Error('Login failed');
					}
				} catch (error: any) {
					failedLogins.set(institutionId, error.message);
				}
			}));

			// Then scrape each account
			return await Promise.all(accounts.map(async (account) => {
				try {
					if (failedLogins.has(account.institution_id)) {
						throw new Error(`Failed to log in to institution: ${failedLogins.get(account.institution_id)}`);
					}

					try {
						const result = await this.scrapeAccount(account, usePage);
						return {
							account_id: account.account_id,
							success: true,
							...result,
						};
					}
					catch (error: any) {
						throw new Error(`Failed to scrape account: ${error.message}`);
					}

				} catch (error: any) {
					console.warn(`Error scraping account ${account.account_id}:`, error);
					return {
						account_id: account.account_id,
						success: false,
						error: error.message,
					};
				}
			}));
		});
	}


	private static async scrapeAccount(account: Account, usePage: UsePage) {
		let accountDetails!: AccountDetails;
		let transactions!: Array<TransactionDetails>;

		await usePage(async (page) => {
			const scraper = InstitutionScrapers[account.institution_id];
			accountDetails = {
				...await scraper.getAccountDetails(page, account.external_account_id),
				institution_id: account.institution_id,
				source: 'scraper',
			};
			const scrapedTransactions = await scraper.getAccountTransactions(page, account);
			transactions = scrapedTransactions.map((transaction) => ({
				...transaction,
				account_id: account.account_id,
				iso_currency_code: account.iso_currency_code || 'USD',
				source: 'scraper',
			}));
		});

		return {
			accountDetails,
			transactions,
		};
	}


	private static async logInToInstitution(usePage: UsePage, institutionId: string, workspaceId: string) {
		let success = false;
		try {
			await InstitutionService.getAllInstitutions(); // Ensure institutions are loaded
			const scraper = InstitutionScrapers[institutionId];
			const institution = await InstitutionDao.getInstitution(institutionId);
			if (!institution) {
				throw new Error(`Institution not found: ${institutionId}`);
			}
			if (!scraper) {
				throw new Error(`No scraper found for institution: ${institutionId}`);
			}
			const creds = InstitutionService.getInstitutionCreds(institutionId, workspaceId);

			await usePage(async (page) => {
				await page.goto(institution.loginUrl!);

				// First check to see if we are already logged in
				const loggedInElement = await page.waitForSelector(scraper.hasLoggedInElement, { timeout: 15000 }).catch(() => null);
				if (!loggedInElement) {
					// check for login element
					await page.waitForSelector(scraper.isAtLoginElement, { timeout: 15000 });
					// Perform the login sequence
					await doPageActions(page, scraper.getLoginSequence(creds));

					// check for logged in element again
					const loggedInElement = await page.waitForSelector(scraper.hasLoggedInElement, { timeout: 15000 }).catch(() => null);
					if (!loggedInElement) {
						console.error('Login failed, did not find logged in element');
						return;
					}
				}

				success = true;
			});

		}
		catch (error: any) {
			console.error(`Failed to log in to institution ${institutionId}:`, error);
			throw error;
		}

		return success;
	}
}
