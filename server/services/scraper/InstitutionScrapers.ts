import type { Page } from "playwright";
import type { InstitutionScraper, ScrapedAccount, ScrapedTransaction } from "./ScraperService";
import { AccountSubtype, AccountType, type AccountDetails, type Account } from "delfi-core/models/Account";
import { DateRegex, dollarsToNumber, find, findInnerText, stringToDate } from "./ScraperUtils";
import { TransactionUtils } from "delfi-core/models/Transaction";
import { peek, wait } from "delfi-core/utils/miscUtils";

export const InstitutionScrapers: Record<string, InstitutionScraper> = {
	/**
	 * AFCU updated their UI and this scraper is no longer up to date!
	 * The extension is currently the up-to-date scraper
	 */
	'test-afcu-id': {
		hasLoggedInElement: 'a.menu-item.logoff',
		isAtLoginElement: 'input#name-callback-1',
		isLoggedOutElement: 'a[data-aa-tracking="login"]',

		getLoginSequence: (creds) => {
			if (!creds.username || !creds.password) {
				throw new Error("Missing credentials for AFCU login");
			}
			return [
				{
					action: 'type',
					selector: 'input#name-callback-1',
					text: creds.username,
				},
				{
					action: 'click',
					selector: 'button#btn-next',
				},
				{
					action: 'type',
					selector: 'input#password-callback-1',
					text: creds.password,
				},
				{
					action: 'click',
					selector: 'button#btn-next',
				}
			]
		},

		mfaMethod: 'auth-app-auto',

		async checkForMfaNeeded(page: Page) {
			return Boolean((await this.isAtSelectMfa(page)) || (await this.isAtSelectMfa(page)));
		},

		async isAtSelectMfa(page: Page) {
			const selectMfaHeader = await page.getByText("Select MFA Method");
			return Boolean(selectMfaHeader);
		},

		async isAtVerifyAuthApp(page: Page) {
			const selectMfaHeader = await page.getByText("Verify Authenticator App");
			return Boolean(selectMfaHeader);
		},

		async initiateMfa(page: Page) {
			if (await this.isAtSelectMfa(page)) {
				// select authenticator app
				const button = page.getByTestId('oath-btn-select-mfa-method');
				await button.click();
			}
			return await this.isAtVerifyAuthApp(page)
		},

		async submitOtp(page: Page, otp: string) {
			await page.fill('input#ov-code-input', otp);
			await page.click('button#btn-next');
		},

		async listAccounts(page: Page): Promise<Array<ScrapedAccount>> {
			// Make sure we start on the accounts page
			await page.goto('https://digital.americafirst.com/americafirstdigitalbanking/uux.aspx#/extension/AccountContainer/Main');
			const accountRows = await page.locator('.accounts-row').all();
			const accountIds = await Promise.all(accountRows.map(async (row) => {
				const testId = (await row.getAttribute('test-id'));
				if (!testId) {
					throw new Error("Failed to get account id!")
				}
				return testId.replace('move-account-row-', '');
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
			const accountPageUrl = `https://digital.americafirst.com/americafirstdigitalbanking/uux.aspx#/account/${external_account_id}?currentTab=details`;
			await page.goto(accountPageUrl);

			await page.waitForSelector('span[test-id="acctHeaderTitle"]');

			const name = (await page.locator('span[test-id="acctHeaderTitle"]')?.innerText()).replace("See what's new", '').trim();

			const detailRowIndexByAccountType = {
				checking: {
					description: 0,
					balance: 2,
				},

				savings: {
					description: 0,
					balance: 2,
				},

				credit_card: {
					balance: 0,
					limit: 5,
					apr: 8,
				},

				line_of_credit: {
					balance: 0,
					limit: 4,
					apr: 7,
				}
			}

			async function getDetailRowAmount(index) {
				return (await page.locator('.detail-tab-pane > dl > .ember-view [test-id="hade-value"]').all())[index]?.locator('.numAmount')?.innerText();
			}
			async function getDetailRowValue(index) {
				return (await page.locator('.detail-tab-pane > dl > .ember-view [test-id="hade-value"]').all())[index]?.innerText();
			}
			async function getDetailRowLabel(index) {
				return (await page.locator('.detail-tab-pane > dl > .ember-view [test-id="hade-detail"]').all())[index]?.innerText();
			}

			let accountType = "";

			// available for many account types but not all
			const description = await getDetailRowValue(0);
			if (description === 'Checking') {
				accountType = AccountSubtype.checking;
			}
			else if (description === 'Share Savings') {
				accountType = AccountSubtype.savings;
			}
			else if (description.startsWith("Money Market")) {
				accountType = AccountSubtype.savings;
			}
			// credit determined by which row is apr
			else if (await getDetailRowLabel(detailRowIndexByAccountType.credit_card.apr) === 'Rate APR') {
				accountType = AccountSubtype.credit_card;
			}
			else if (await getDetailRowLabel(detailRowIndexByAccountType.line_of_credit.apr) === 'Rate APR') {
				accountType = AccountSubtype.line_of_credit;
			}
			else {
				accountType = AccountSubtype.savings;
			}

			const accountTypeConfig = detailRowIndexByAccountType[accountType];
			const aprValue = accountTypeConfig?.apr ? await getDetailRowValue(accountTypeConfig.apr) : null;
			const limit = accountTypeConfig?.limit ? await getDetailRowAmount(accountTypeConfig.limit) : null;

			// Credit Card balances and transactions are shown as positive for a debt
			const type = accountType.includes('credit') ? AccountType.credit : AccountType.depository;
			const balanceNegator = type === AccountType.credit ? -1 : 1;

			return {
				external_account_id,
				mask: '',
				external_name: name,
				current_balance: balanceNegator * dollarsToNumber(await getDetailRowAmount(accountTypeConfig.balance)),
				type,
				subtype: accountType as any,
				iso_currency_code: 'USD',
				apr: aprValue ? Number(aprValue.replace('%', '')) : null,
				limit: limit ? dollarsToNumber(limit) : null,
			};
		},

		async getAccountTransactions(page, account: Account): Promise<Array<ScrapedTransaction>> {
			const accountPageUrl = `https://digital.americafirst.com/americafirstdigitalbanking/uux.aspx#/account/${account.external_account_id}?currentTab=transactions`;
			await page.goto(accountPageUrl);

			const transactions: Array<ScrapedTransaction> = [];
			await page.waitForSelector('.transaction-history-item');

			// // Option for pulling from farther back in time
			// const hardPull = true;
			// if (hardPull) {
			// 	const select = await page.locator('#TransactionFilter_TransactionDatePeriod');
			// 	await select.selectOption('Ninety');
			// 	await page.waitForResponse(response => response.url().includes('/FilterTransactionsExtension') && response.status() === 200);
			// 	console.log("Loaded 90 day transaction history");
			// 	await wait(1000); // sometimes the data takes a moment to appear even after the response
			// }

			// async function scrapeTable(tableId: string, pending: boolean) {
			// 	let rows = await page.locator(`#${tableId} tbody tr`).all();
			// 	console.log(`Found ${rows.length} rows in table ${tableId} (pending=${pending})`);
			// 	for (const row of rows) {
			// 		const exists = await row.locator('.column-date').count();
			// 		if (!exists) {
			// 			continue; // Skip rows without a date
			// 		}
			// 		const date = await row.locator('.column-date').innerText();
			// 		const description = await row.locator('.column-description').innerText();
			// 		const amountCols = await row.locator('.column-amount').all();
			// 		const amount = (await amountCols[amountCols.length - 1].innerText()).replaceAll(/[$,]/g, '');
			// 		const balance = await (await find(row, '.column-balance'))?.innerText();
			// 		const useInverseAmount = pending || account.type === AccountType.credit;

			// 		const mainTransactionAmount = useInverseAmount ? -dollarsToNumber(amount) : dollarsToNumber(amount);
			// 		const finalAccountBalance = dollarsToNumber(balance);

			// 		transactions.push({
			// 			account_id: account.account_id,
			// 			date: stringToDate(date),
			// 			original_description: description,
			// 			amount: mainTransactionAmount,
			// 			account_balance: finalAccountBalance,
			// 			source: 'scraper',
			// 			pending,
			// 		});

			// 		// LINE OF CREDIT
			// 		// AFCU's line of credit account shows interest and fees on the same row as payment transfers.
			// 		// We will treat the entire payment amount as one transfer (above) in order to pair it with the corresponding transaction on the other account.
			// 		// We will create a new transaction record here indicating the fee or interest charge as a debit to the account.
			// 		// We will insert it as if it occurred just prior to the payment.
			// 		// Because this scraper reads down the table in reverse chronological order, we will insert the fee/interest transaction just after the payment.
			// 		// We have never yet had a fee, so I'm not 100% sure what that will look like. For now only handle interest.
			// 		if (account.subtype === AccountSubtype.line_of_credit) {
			// 			const interestAmount = (await row.locator('.column-interest').innerText()).replaceAll(/[$,]/g, '');
			// 			if (interestAmount && interestAmount !== '0.00') {
			// 				transactions.push({
			// 					date: stringToDate(date),
			// 					original_description: 'Line of Credit Interest',
			// 					amount: -dollarsToNumber(interestAmount),
			// 					// assume the balance to be the total end balance before this whole payment, minus this interest
			// 					account_balance: finalAccountBalance - mainTransactionAmount - dollarsToNumber(interestAmount),
			// 					source: 'scraper',
			// 					pending,
			// 					category_key: 'BANK_FEES_INTEREST_CHARGE',
			// 					account_id: account.account_id,
			// 				});
			// 			}
			// 		}
			// 	};
			// }

			// // AFCU creates pending transactions on both the checking account and the line of credit account.
			// // Don't capture pending transactions on the line of credit account to avoid duplicates.
			// if (account.subtype !== AccountSubtype.line_of_credit) {
			// 	await scrapeTable('UpcomingTransactionsGrid', true);
			// }
			// await scrapeTable('PastTransactionsGrid', false);

			const rows = await page.locator('.transaction-history-item').all();

			for (const row of rows) {
				try {
					// click to open accordion
					await row.locator('a[test-id="blkAccordionHeader"]').click();
					await wait(400);

					const pending = Boolean(await find(row, '[aria-label="Pending"]'));
					const date = await findInnerText(row, '[test-id="lblDate"] dd'); // mm/dd/yyyy
					const description = await findInnerText(row, '[test-id="lblDescription"] dd');
					// TODO use merchant image
					const merchantImg = (await find(row, 'q2-avatar'))?.getAttribute('src');
					const amount = await findInnerText(row, '.col-amount .amount .numAmount'); // $10.00 or ($10.00)
					const account_balance = await findInnerText(row, '.col-amount .account-balance-text .numAmount'); // $10.00 or ($10.00)
					
					// console.log({pending, date,description,amount,balance: account_balance,merchantImg})

					function parseAmount(amountText = '', accountType: AccountType) {
						const isForcedPositive = amountText.includes('+');
						let absNumber = Number(amountText.trim().replace('+', '').replace('(', '-').replace('$', '').replace(')', '').replace(',', '').replace(' ', ''));
						const negator = (accountType === AccountType.credit && !isForcedPositive) ? -1 : 1;
						return absNumber * negator;
					}

					if (account_balance?.includes('+')) {
						console.log("DETECTED POSITIVE!", account_balance, parseAmount(account_balance, account.type))
					}

					const tx: ScrapedTransaction = {
						date: stringToDate(date!, DateRegex.MMDDYYYY),
						original_description: description!,
						amount: parseAmount(amount, account.type),
						account_balance: account_balance ? (parseAmount(account_balance, account.type)) : null,
						account_id: account.account_id,
						source: 'scraper',
						pending,
					};
					transactions.push(tx);

					// LINE OF CREDIT
					// AFCU's line of credit account shows interest and fees on the same row as payment transfers.
					// We will treat the entire payment amount as one transfer (above) in order to pair it with the corresponding transaction on the other account.
					// We will create a new transaction record here indicating the fee or interest charge as a debit to the account.
					// We will insert it as if it occurred just prior to the payment.
					// Because this scraper reads down the table in reverse chronological order, we will insert the fee/interest transaction just after the payment.
					// We have never yet had a fee, so I'm not 100% sure what that will look like. For now only handle interest.
					//
					if (account.subtype === 'line_of_credit') {
						const interestRow = await find(row, '[test-id="blkTransactionData"] .definition-list-item', { n: 1 });

						// The interest label does not appear at all if no interest was taken
						if (interestRow) {
							// sanity check: make sure this is the interest row
							if ((await findInnerText(interestRow, 'dt')) !== 'Interest:') {
								throw new Error("Selected the wrong row for interest!")
							}

							const interestAmount = parseAmount(await interestRow.locator('dd').innerText(), account.type);
							if (interestAmount && interestAmount !== 0) {
								transactions.push({
									date: stringToDate(date!),
									original_description: 'Line of Credit Interest',
									// represent amount as a negative hit on the balance, i.e, more debt
									amount: -interestAmount,
									// assume the balance to be the total end balance before this whole payment, minus this interest
									account_balance: tx.account_balance ? tx.account_balance - tx.amount - interestAmount : null,
									source: 'extension',
									pending,
									category_key: 'BANK_FEES_INTEREST_CHARGE',
									account_id: account.account_id,
								});
							}
						}
					}
				}
				catch (e) {
					console.log(e);
					await wait(20000);
					throw e;
				}
			};

			return transactions;
		},
	}
}
