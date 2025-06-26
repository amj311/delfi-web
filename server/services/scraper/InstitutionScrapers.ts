import type { Page } from "playwright";
import type { InstitutionScraper, ScrapedAccount, ScrapedTransaction } from "./ScraperService";
import { AccountSubtype, AccountType, type AccountDetails } from "delfi-core/models/Account";
import { dollarsToNumber, stringToDate } from "./ScraperUtils";

export const InstitutionScrapers: Record<string, InstitutionScraper> = {
	'test-afcu-id': {
		loginUrl: 'https://secure.americafirst.com/#/login',
		hasLoggedInElement: 'a[title="Log Out"]',
		isAtLoginElement: 'input#name-callback-1',
		isLoggedOutElement: 'a[data-aa-tracking="login"]',
		getLoginSequence: (username, password) => [
			{
				action: 'type',
				selector: 'input#name-callback-1',
				text: username,
			},
			{
				action: 'click',
				selector: 'button#btn-next',
			},
			{
				action: 'type',
				selector: 'input#password-callback-1',
				text: password,
			},
			{
				action: 'click',
				selector: 'button#btn-next',
			}
		],

		async listAccounts(page: Page): Promise<Array<ScrapedAccount>> {
			// Make sure we start on the accounts page
			await page.goto('https://webaccess45.americafirst.com/banking/Accounts');
			const accountRows = await page.locator('#account-lists-container tr').all();
			const accountIds = await Promise.all(accountRows.map(async (row) => {
				const exists = await row.locator('.column-account-name a').count();
				if (!exists) {
					return null;
				}const link = await row.locator('.column-account-name a').first().getAttribute('href');
				if (!link) return null;
				const id = link.match(/\/Details\/Index\/(\d+)/)?.[1];
				return id ? id : null;
			}));

			const accounts: Array<ScrapedAccount> = [];
			for (const id of accountIds) {
				if (!id) continue;
				accounts.push(await this.getAccountDetails(page, id));
			}
			return accounts;
		},

		async getAccountDetails(page, external_account_id) {
			// Implement the logic to get account details
			const accountPageUrl = `https://webaccess45.americafirst.com/banking/Accounts/Details/Index/${external_account_id}`;
			await page.goto(accountPageUrl);

			const mask = (await page.locator('.account-number').innerText()).replaceAll('*', '');

			async function getMatchingRowValue(searchText: string): Promise<string | null> {
				const exists = await page.locator('.account-details .row', { hasText: searchText }).count();
				if (!exists) {
					return null;
				}
				const row = await page.locator('.account-details .row', { hasText: searchText }).first();
				const text = await row?.locator('.detail-item').innerText();
				return text ? text.trim() : null;
			}
			const afcuType = await getMatchingRowValue('Type:');
			const afcuName = await getMatchingRowValue('Nickname:');
			// const currentBalance = await page.locator('.primary-label-amount .money').innerText() || await getMatchingRowValue('Current Balance:');
			const currentBalance = await getMatchingRowValue('Balance:');
			// const availableBalance = await getMatchingRowValue('Available Balance:');
			const limit = await getMatchingRowValue('Limit:');

			const typeMap = {
				'Checking': { type: AccountType.depository, subtype: AccountSubtype.checking },
				'Money Market': { type: AccountType.depository, subtype: AccountSubtype.savings },
				'Savings': { type: AccountType.depository, subtype: AccountSubtype.savings },
				'Visa': { type: AccountType.credit, subtype: AccountSubtype.credit_card },
				'Line of Credit': { type: AccountType.credit, subtype: AccountSubtype.line_of_credit },
			}

			const typeMatch = typeMap[Object.keys(typeMap).find(key => afcuType?.includes(key)) || ''] as any;

			return {
				mask: mask || '',
				current_balance: currentBalance ? dollarsToNumber(currentBalance) : 0,
				// available_balance: availableBalance ? dollarsToNumber(availableBalance) : undefined,
				limit: limit ? dollarsToNumber(limit) : undefined,
				external_name: afcuName || '',
				type: typeMatch?.type || AccountType.other,
				subtype: typeMatch?.subtype || AccountSubtype.other,
				external_account_id: external_account_id,
				iso_currency_code: 'USD',
			}
		},

		async getAccountTransactions(page, account: AccountDetails): Promise<Array<ScrapedTransaction>> {
			const accountPageUrl = `https://webaccess45.americafirst.com/banking/Accounts/Details/Index/${account.external_account_id}`;
			await page.goto(accountPageUrl);

			const transactions: Array<ScrapedTransaction> = [];
			await page.waitForSelector('#PastTransactionsGrid');

			async function scrapeTable(tableId: string, pending: boolean) {
				let rows = await page.locator(`#${tableId} tbody tr`).all();
				console.log(`Found ${rows.length} rows in ${account.external_name} ${tableId}`);
				for (const row of rows) {
					const exists = await row.locator('.column-date').count();
					if (!exists) {
						continue; // Skip rows without a date
					}
					const date = await row.locator('.column-date').innerText();
					const description = await row.locator('.column-description').innerText();
					const amountCols = await row.locator('.column-amount').all();
					const amount = (await amountCols[amountCols.length - 1].innerText()).replaceAll(/[$,]/g, '');
					const useInverseAmount = pending || account.type === AccountType.credit;
					transactions.push({
						date: stringToDate(date),
						original_description: description,
						amount: useInverseAmount ? -dollarsToNumber(amount) : dollarsToNumber(amount),
						source: 'scraper',
						pending,
					});
				};
			}

			await scrapeTable('UpcomingTransactionsGrid', true);
			await scrapeTable('PastTransactionsGrid', false);

			return transactions;
		},
	}
}

