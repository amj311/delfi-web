import type { Page } from "playwright";
import type { InstitutionScraper, ScrapedAccount, ScrapedTransaction } from "./ScraperService";
import { AccountSubtype, AccountType, type AccountDetails, type Account } from "delfi-core/models/Account";
import { dollarsToNumber, find, stringToDate } from "./ScraperUtils";
import { TransactionUtils } from "delfi-core/models/Transaction";
import { wait } from "delfi-core/utils/miscUtils";

export const InstitutionScrapers: Record<string, InstitutionScraper> = {
	/**
	 * AFCU updated their UI and this scraper is no longer up to date!
	 * The extension is currently the up-to-date scraper
	 */
	// 'test-afcu-id': {
	// 	hasLoggedInElement: 'a[title="Log Out"]',
	// 	isAtLoginElement: 'input#name-callback-1',
	// 	isLoggedOutElement: 'a[data-aa-tracking="login"]',

	// 	getLoginSequence: (creds) => {
	// 		if (!creds.username || !creds.password) {
	// 			throw new Error("Missing credentials for AFCU login");
	// 		}
	// 		return [
	// 			{
	// 				action: 'type',
	// 				selector: 'input#name-callback-1',
	// 				text: creds.username,
	// 			},
	// 			{
	// 				action: 'click',
	// 				selector: 'button#btn-next',
	// 			},
	// 			{
	// 				action: 'type',
	// 				selector: 'input#password-callback-1',
	// 				text: creds.password,
	// 			},
	// 			{
	// 				action: 'click',
	// 				selector: 'button#btn-next',
	// 			}
	// 		]
	// 	},

	// 	async checkForOtpNeeded(page: Page) {
	// 		return Boolean((await this.isAtSelectMfa(page)) || (await this.isAtOtpMethod(page)));
	// 	},

	// 	async isAtSelectMfa(page: Page) {
	// 		const selectMfaHeader = await page.getByText("Select MFA Method");
	// 		return Boolean(selectMfaHeader);
	// 	},

	// 	async isAtOtpMethod(page: Page) {
	// 		const otpHeader = await page.getByText("OTP Verification Method");
	// 		return Boolean(otpHeader);
	// 	},

	// 	async initiateOtp(page: Page) {
	// 		if (await this.isAtSelectMfa(page)) {
	// 			// select otp
	// 			const button = page.getByTestId('otp-btn-select-mfa-method');
	// 			await button.click();
	// 		}
	// 		console.log("after select mfa")
	// 		console.log(await this.isAtOtpMethod(page))
	// 		if (await this.isAtOtpMethod(page)) {
	// 			console.log("doing otp")
	// 			// select sms
	// 			const button = await page.locator('button', { hasText: "Next" });
	// 			console.log(button)
	// 			await button.click();
	// 		}
	// 	},
	// 	async submitOtp(page: Page, otp: string) {
	// 		await page.fill('input[name="otp-code"]', otp);
	// 		await page.click('button#btn-next');
	// 	},

	// 	async listAccounts(page: Page): Promise<Array<ScrapedAccount>> {
	// 		// Make sure we start on the accounts page
	// 		await page.goto('https://webaccess45.americafirst.com/banking/Accounts');
	// 		const accountRows = await page.locator('#account-lists-container tr').all();
	// 		const accountIds = await Promise.all(accountRows.map(async (row) => {
	// 			const exists = await row.locator('.column-account-name a').count();
	// 			if (!exists) {
	// 				return null;
	// 			}
	// 			const link = await row.locator('.column-account-name a').first().getAttribute('href');
	// 			if (!link) return null;
	// 			const id = link.match(/\/Details\/Index\/(\d+)/)?.[1];
	// 			return id ? id : null;
	// 		}));

	// 		const accounts: Array<ScrapedAccount> = [];
	// 		for (const id of accountIds) {
	// 			if (!id) continue;
	// 			accounts.push(await this.getAccountDetails(page, id));
	// 		}
	// 		return accounts;
	// 	},

	// 	async getAccountDetails(page, external_account_id) {
	// 		// Implement the logic to get account details
	// 		const accountPageUrl = `https://webaccess45.americafirst.com/banking/Accounts/Details/Index/${external_account_id}`;
	// 		await page.goto(accountPageUrl);

	// 		const mask = (await page.locator('.account-number').innerText()).replaceAll('*', '');

	// 		async function getMatchingRowValue(searchText: string): Promise<string | null> {
	// 			const exists = await page.locator('.account-details .row', { hasText: searchText }).count();
	// 			if (!exists) {
	// 				return null;
	// 			}
	// 			const row = await page.locator('.account-details .row', { hasText: searchText }).first();
	// 			const text = await row?.locator('.detail-item').innerText();
	// 			return text ? text.trim() : null;
	// 		}
	// 		const afcuType = await getMatchingRowValue('Type:');
	// 		const afcuName = await getMatchingRowValue('Nickname:');
	// 		// const currentBalance = await page.locator('.primary-label-amount .money').innerText() || await getMatchingRowValue('Current Balance:');
	// 		const currentBalance = await getMatchingRowValue('Balance:');
	// 		const balanceAmount = currentBalance ? dollarsToNumber(currentBalance) : 0;
	// 		// const availableBalance = await getMatchingRowValue('Available Balance:');
	// 		const limit = await getMatchingRowValue('Limit:');

	// 		const typeMap = {
	// 			'Checking': { type: AccountType.depository, subtype: AccountSubtype.checking },
	// 			'Money Market': { type: AccountType.depository, subtype: AccountSubtype.savings },
	// 			'Savings': { type: AccountType.depository, subtype: AccountSubtype.savings },
	// 			'Visa': { type: AccountType.credit, subtype: AccountSubtype.credit_card },
	// 			'Line of Credit': { type: AccountType.credit, subtype: AccountSubtype.line_of_credit },
	// 		}

	// 		const typeMatch = typeMap[Object.keys(typeMap).find(key => afcuType?.includes(key)) || ''] as any;

	// 		// Credit Card balances are shown as positive for a debt
	// 		const negateBalance = typeMatch?.subtype === AccountSubtype.credit_card;

	// 		return {
	// 			mask: mask || '',
	// 			current_balance: negateBalance ? -balanceAmount : balanceAmount,
	// 			// available_balance: availableBalance ? dollarsToNumber(availableBalance) : undefined,
	// 			limit: limit ? dollarsToNumber(limit) : undefined,
	// 			external_name: afcuName || '',
	// 			type: typeMatch?.type || AccountType.other,
	// 			subtype: typeMatch?.subtype || AccountSubtype.other,
	// 			external_account_id: external_account_id,
	// 			iso_currency_code: 'USD',
	// 		}
	// 	},

	// 	async getAccountTransactions(page, account: Account): Promise<Array<ScrapedTransaction>> {
	// 		const accountPageUrl = `https://webaccess45.americafirst.com/banking/Accounts/Details/Index/${account.external_account_id}`;
	// 		await page.goto(accountPageUrl);

	// 		const transactions: Array<ScrapedTransaction> = [];
	// 		await page.waitForSelector('#PastTransactionsGrid');

	// 		// Option for pulling from farther back in time
	// 		const hardPull = true;
	// 		if (hardPull) {
	// 			const select = await page.locator('#TransactionFilter_TransactionDatePeriod');
	// 			await select.selectOption('Ninety');
	// 			await page.waitForResponse(response => response.url().includes('/FilterTransactionsExtension') && response.status() === 200);
	// 			console.log("Loaded 90 day transaction history");
	// 			await wait(1000); // sometimes the data takes a moment to appear even after the response
	// 		}

	// 		async function scrapeTable(tableId: string, pending: boolean) {
	// 			let rows = await page.locator(`#${tableId} tbody tr`).all();
	// 			console.log(`Found ${rows.length} rows in table ${tableId} (pending=${pending})`);
	// 			for (const row of rows) {
	// 				const exists = await row.locator('.column-date').count();
	// 				if (!exists) {
	// 					continue; // Skip rows without a date
	// 				}
	// 				const date = await row.locator('.column-date').innerText();
	// 				const description = await row.locator('.column-description').innerText();
	// 				const amountCols = await row.locator('.column-amount').all();
	// 				const amount = (await amountCols[amountCols.length - 1].innerText()).replaceAll(/[$,]/g, '');
	// 				const balance = await (await find(row, '.column-balance'))?.innerText();
	// 				const useInverseAmount = pending || account.type === AccountType.credit;

	// 				const mainTransactionAmount = useInverseAmount ? -dollarsToNumber(amount) : dollarsToNumber(amount);
	// 				const finalAccountBalance = dollarsToNumber(balance);

	// 				transactions.push({
	// 					account_id: account.account_id,
	// 					date: stringToDate(date),
	// 					original_description: description,
	// 					amount: mainTransactionAmount,
	// 					account_balance: finalAccountBalance,
	// 					source: 'scraper',
	// 					pending,
	// 				});

	// 				// LINE OF CREDIT
	// 				// AFCU's line of credit account shows interest and fees on the same row as payment transfers.
	// 				// We will treat the entire payment amount as one transfer (above) in order to pair it with the corresponding transaction on the other account.
	// 				// We will create a new transaction record here indicating the fee or interest charge as a debit to the account.
	// 				// We will insert it as if it occurred just prior to the payment.
	// 				// Because this scraper reads down the table in reverse chronological order, we will insert the fee/interest transaction just after the payment.
	// 				// We have never yet had a fee, so I'm not 100% sure what that will look like. For now only handle interest.
	// 				if (account.subtype === AccountSubtype.line_of_credit) {
	// 					const interestAmount = (await row.locator('.column-interest').innerText()).replaceAll(/[$,]/g, '');
	// 					if (interestAmount && interestAmount !== '0.00') {
	// 						transactions.push({
	// 							date: stringToDate(date),
	// 							original_description: 'Line of Credit Interest',
	// 							amount: -dollarsToNumber(interestAmount),
	// 							// assume the balance to be the total end balance before this whole payment, minus this interest
	// 							account_balance: finalAccountBalance - mainTransactionAmount - dollarsToNumber(interestAmount),
	// 							source: 'scraper',
	// 							pending,
	// 							category_key: 'BANK_FEES_INTEREST_CHARGE',
	// 							account_id: account.account_id,
	// 						});
	// 					}
	// 				}
	// 			};
	// 		}

	// 		// AFCU creates pending transactions on both the checking account and the line of credit account.
	// 		// Don't capture pending transactions on the line of credit account to avoid duplicates.
	// 		if (account.subtype !== AccountSubtype.line_of_credit) {
	// 			await scrapeTable('UpcomingTransactionsGrid', true);
	// 		}
	// 		await scrapeTable('PastTransactionsGrid', false);

	// 		return transactions;
	// 	},
	// }
}
