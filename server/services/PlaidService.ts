// SETUP PLAID
import { Configuration, CountryCode, PlaidApi, PlaidEnvironments, Products } from 'plaid';
import dayjs from 'dayjs';
import { PlaidDao } from 'server/data/PlaidDao';
import { AccountDao } from 'server/data/AccountDao';
import { InstitutionDao } from 'server/data/InstitutionDao';
import { asAny } from 'delfi-core/utils/miscUtils';
import { TransactionDao } from 'server/data/TransactionDao';
import { MerchantDao } from 'server/data/MerchantDao';
import { TestDataService } from './TestDataService';
import { CategoryDao } from 'server/data/CategoryDao';
import { TransactionUtils } from 'delfi-core/models/Transaction';
import { ddate } from 'delfi-core/utils/dateUtils';

// Plaid Items define a single workspace's connection to a financial institution
export type PlaidItem = {
	plaid_item_id: string;
	access_token: string;
	plaid_institution_id: string;
	workspace_id: string;
}

const {
	PLAID_CLIENT_ID,
	PLAID_SECRET,
	PLAID_ENV = 'sandbox', // Default to sandbox if not set
	PLAID_WEBHOOK_URL
} = process.env;

const PLAID_ITEMID = 'wjQPEwk33XtGQellX9y8FDDV6aN86vCrpWxPa';

// Define available products
const PLAID_PRODUCTS = [
	Products.Transactions,
	// Products.Investments,
	// Products.Liabilities,
	// Add other products as needed:
	Products.Auth,
];

// Define the environment
const environmentMap = {
	'sandbox': PlaidEnvironments.sandbox,
	'development': PlaidEnvironments.development,
	'production': PlaidEnvironments.production
};

const configuration = new Configuration({
	basePath: environmentMap[PLAID_ENV] || PlaidEnvironments.sandbox,
	baseOptions: {
		headers: {
			'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
			'PLAID-SECRET': PLAID_SECRET,
		},
	},
});

const plaid = new PlaidApi(configuration);

export const PlaidService = {
	async getLinkToken(workspaceId, redirect_uri = null) {
		// Create a link token with more configurations
		const { data } = await plaid.linkTokenCreate({
			client_id: PLAID_CLIENT_ID,
			secret: PLAID_SECRET,
			products: PLAID_PRODUCTS,
			client_name: 'Delfi',
			language: 'en',
			country_codes: [CountryCode.Us],
			user: {
				client_user_id: workspaceId,
			},
			// Add webhook support if configured
			...(PLAID_WEBHOOK_URL ? { webhook: PLAID_WEBHOOK_URL } : {}),
			// Add redirect URI for OAuth authentication flows
			...(redirect_uri ? { redirect_uri } : {}),
			// Add link customization options
			link_customization_name: 'default',
			// If in production, add auth configuration to control phone verification
			// ...(PLAID_ENV === 'production' ? {

			// Optional: For re-authenticating when needed
			// update_mode: 'DEFAULT', // Uncomment for Link update mode
		});
		return data;
	},

	// async getLinkTokenForItemUpdate(workspaceId, itemId) {
	// 	// Create a link token specifically for updating an existing item
	// 	try {
	// 		// First, check if we have the item in our database
	// 		const plaidItem = await prisma.plaidItem.findFirst({
	// 			where: { plaid_item_id: itemId }
	// 		});

	// 		if (!plaidItem) {
	// 			throw new Error(`Item with ID ${itemId} not found in database`);
	// 		}

	// 		// Create a link token with update mode enabled
	// 		const { data } = await plaid.linkTokenCreate({
	// 			client_id: PLAID_CLIENT_ID,
	// 			secret: PLAID_SECRET,
	// 			// No products array needed in update mode
	// 			client_name: 'Delfi',
	// 			language: 'en',
	// 			country_codes: [CountryCode.Us],
	// 			user: {
	// 				client_user_id: workspaceId, // You may want to use a real workspace ID here
	// 			},
	// 			...(PLAID_WEBHOOK_URL ? { webhook: PLAID_WEBHOOK_URL } : {}),
	// 			link_customization_name: 'default',
	// 			access_token: plaidItem.access_token, // This is important for update mode
	// 			update: {
	// 				account_selection_enabled: true // Allow selecting accounts again if needed
	// 			}
	// 		});

	// 		return data;
	// 	} catch (error) {
	// 		console.error('Error creating link token for item update:', error);
	// 		throw error;
	// 	}
	// },

	async saveNewConnection(workspace_id, public_token, metadata, accountMappings = {}) {
		try {

			// // Make sure this connection doesn't already exist
			// const existingItem = (await PlaidDao.getWorkspaceItems(workspace_id)).find(item => item.plaid_item_id === metadata.institution_id);
			// if (existingItem) {
			// 	throw new Error(`Connection to institution ${metadata.institution_id} already exists for workspace ${workspace_id}.`);
			// }

			const { data } = await plaid.itemPublicTokenExchange({
				client_id: PLAID_CLIENT_ID,
				secret: PLAID_SECRET,
				public_token
			});
			// const { access_token } = data;
			// const { data: { accounts, item } } = await plaid.accountsBalanceGet({ access_token });
			// console.log("got accounts", { accounts, access_token, item })

			const resData = {
				accounts: [
					{
						account_id: 'vv65QojdoDCoRbBAVjqPI91robopVmhYXbZJk',
						balances: [Object],
						mask: '9094',
						name: 'Checking',
						official_name: 'Checking',
						subtype: 'checking',
						type: 'depository'
					},
					{
						account_id: '3JavPOrMObHLQ1npXew4Sko6R5pdk3izVk1dz',
						balances: [Object],
						mask: '9094',
						name: 'Tax Reserve',
						official_name: 'Share Savings',
						subtype: 'savings',
						type: 'depository'
					}
				],
				access_token: 'access-production-8b922830-8767-435f-b0e3-db3b986cd173',
				item: {
					auth_method: 'INSTANT_AUTH',
					available_products: ['balance'],
					billed_products: ['auth', 'transactions'],
					consent_expiration_time: null,
					consented_products: ['auth', 'transactions'],
					error: null,
					institution_id: 'ins_120013',
					institution_name: 'America First Credit Union',
					item_id: 'gnB9xAw4A7Cm0DN9Qn4eI4b5MpXYZ4FqAdnp5',
					products: ['auth', 'transactions'],
					update_type: 'background',
					webhook: ''
				}
			}

			const { accounts, item, access_token } = resData;

			if (!item.institution_id) {
				throw new Error("Item does not have an institution ID. Cannot save connection.");
			}

			// save new item and token
			await PlaidDao.createItem({
				plaid_item_id: item.item_id,
				access_token,
				plaid_institution_id: item.institution_id,
				workspace_id,
			});

			// Create institution if it doesn't exist
			// If it does, just update the details
			const institutionData = (await InstitutionDao.matchAny({
				name: item.institution_name as string,
				plaid_institution_id: item.institution_id,
			})) || {
				institution_id: '', // Placeholder, will be set later
				name: item.institution_name as string,
				plaid_institution_id: item.institution_id,
				logo: '', // Default logo if not found
			};

			try {
				const plaidInstitutionData = await this.getInstitutionById(item.institution_id);
				institutionData.logo = plaidInstitutionData.logo || institutionData.logo;
			} catch (error) {
				console.error('Error fetching institution details:', error);
			}

			if (!institutionData.institution_id) {
				await InstitutionDao.createInstitution(institutionData);
			}
			else {
				await InstitutionDao.updateInstitution(institutionData.institution_id, institutionData);
			}

			// Connect or create accounts
			for (const itemAccount of accounts) {
				// Check if account already exists
				let existingAccount = await AccountDao.matchAll({
					workspace_id,
					institution_id: institutionData.institution_id,
					external_name: itemAccount.name,
				});
				if (!existingAccount)  {
					// search again with the official name
					existingAccount = await AccountDao.matchAll({
						workspace_id,
						institution_id: institutionData.institution_id,
						external_name: itemAccount.official_name || '',
					});
				}

				if (existingAccount) {
					// Update existing account with new details
					await AccountDao.updateAccount(workspace_id, existingAccount.account_id, {
						plaid_item_id: item.item_id,
						plaid_account_id: itemAccount.account_id,
					});
				} else {
					// Create new account
					await AccountDao.createAccount(workspace_id, {
						external_name: itemAccount.name,
						plaid_item_id: item.item_id,
						plaid_account_id: itemAccount.account_id,
						institution_id: institutionData.institution_id,
						mask: itemAccount.mask || '',
						external_account_id: '',
						type: itemAccount.type as any, // TODO define a safe mapping for these
						subtype: itemAccount.subtype as any,
						iso_currency_code: 'USD',
						source: 'plaid',
						source_data: itemAccount,
						current_balance: asAny(itemAccount.balances).current,
						available_balance: asAny(itemAccount.balances).available,
						created_at: new Date(),
					});
				}
			}
		}
		catch (e) {
			console.log(e)
		}
	},

	async getInstitutionById(institutionId) {
		try {
			// Fetch institution details by ID
			const { data } = await plaid.institutionsGetById({
				client_id: PLAID_CLIENT_ID,
				secret: PLAID_SECRET,
				institution_id: institutionId,
				country_codes: [CountryCode.Us],
			});

			return data.institution;
		} catch (error) {
			console.error('Error fetching institution by ID:', error);
			throw error;
		}
	},

	/**
	 * Create a link token to re-authenticate an item when access token is not available
	 * This can be used when the access token is no longer saved in the database
	 * The user will need to go through the Plaid authentication flow again
	 */
	// async createLinkTokenForReauthentication(itemId) {
	// 	try {
	// 		// Create a link token specifically for re-authenticating an existing item
	// 		const { data } = await plaid.linkTokenCreate({
	// 			client_id: PLAID_CLIENT_ID,
	// 			secret: PLAID_SECRET,
	// 			client_name: 'Delfi',
	// 			language: 'en',
	// 			country_codes: [CountryCode.Us],
	// 			user: {
	// 				client_user_id: 'workspace-id', // You may want to use a real workspace ID here
	// 			},
	// 			...(PLAID_WEBHOOK_URL ? { webhook: PLAID_WEBHOOK_URL } : {}),
	// 			link_customization_name: 'default',
	// 			// When re-authenticating without an access token, we use the item_id 
	// 			// to help Plaid identify the correct financial institution
	// 			institution_id: '', // Optional: Add institution ID if you know it
	// 			// For update mode with item id
	// 			update: {
	// 				// This field enables account selection in update mode
	// 				account_selection_enabled: true
	// 			}
	// 		});

	// 		return data;
	// 	} catch (error) {
	// 		console.error('Error creating link token for re-authentication:', error);
	// 		throw error;
	// 	}
	// },

	// /**
	//  * After re-authentication using the link token, save the new access token
	//  * This function should be called once the user completes the re-authentication flow
	//  * and you receive a new public_token
	//  */
	// async saveReauthenticatedItem(itemId, publicToken) {
	// 	try {
	// 		// Exchange the public token for an access token
	// 		const { data } = await plaid.itemPublicTokenExchange({
	// 			client_id: PLAID_CLIENT_ID,
	// 			secret: PLAID_SECRET,
	// 			public_token: publicToken
	// 		});

	// 		const { access_token, item_id } = data;

	// 		// Update the item in the database with the new access token
	// 		await prisma.plaidItem.update({
	// 			where: { plaid_item_id: itemId },
	// 			data: { access_token }
	// 		});

	// 		// Verify the access token works by getting account information
	// 		const accountsResponse = await plaid.accountsGet({ access_token });

	// 		return {
	// 			success: true,
	// 			item_id,
	// 			accounts: accountsResponse.data.accounts
	// 		};
	// 	} catch (error) {
	// 		console.error('Error saving re-authenticated item:', error);
	// 		throw error;
	// 	}
	// },

	// /**
	//  * Get transactions using the transactions/sync endpoint
	//  * This requires a valid access token
	//  */
	// async syncTransactions(itemId) {
	// 	try {
	// 		// First get the access token for the item
	// 		const plaidItem = await prisma.plaidItem.findFirst({
	// 			where: { plaid_item_id: itemId }
	// 		});

	// 		if (!plaidItem || !plaidItem.access_token) {
	// 			throw new Error(`Access token for item ${itemId} not found. Item needs re-authentication.`);
	// 		}

	// 		// Call the transactions/sync endpoint with an empty cursor for initial sync
	// 		const response = await plaid.transactionsSync({
	// 			access_token: plaidItem.access_token,
	// 			// Use empty string for initial sync instead of null to avoid type errors
	// 			cursor: '',
	// 		});

	// 		return response.data;
	// 	} catch (error) {
	// 		console.error('Error syncing transactions:', error);
	// 		throw error;
	// 	}
	// },

	/**
	 * Get transactions for a specific account
	 * This fetches all transactions for the account using the access token for the item
	 */
	async getItemTransactions(workspace_id, itemId) {
		try {
			const plaidItem = await PlaidDao.getItemById(itemId);

			if (!plaidItem) {
				throw new Error(`Plaid item for item ${itemId} not found for workspace ${workspace_id}.`);
			}

			if (!plaidItem.access_token) {
				throw new Error(`Access token for item ${itemId} not available. Item needs re-authentication.`);
			}

			const { data: { transactions } } = await plaid.transactionsGet({
				access_token: plaidItem.access_token,
				start_date: dayjs().subtract(1, 'month').format('YYYY-MM-DD'), // TODO lower this in prod
				end_date: dayjs().format('YYYY-MM-DD'),
			});

			return transactions;
		} catch (error) {
			console.error('Error fetching institution transactions:', error);
			throw error;
		}
	},

	/**
	 * Searches for Plaid transactions for a workspace's connected accounts and attempts to match them with existing transactions in the database.
	 * If a match is found, additional details from Plaid will be added to the existing transaction.
	 * @param workspace_id 
	 */
	async searchForPlaidTransactionData(workspace_id) {
		const workspacePlaidItems = await PlaidDao.getWorkspaceItems(workspace_id);
		const workspaceAccounts = await AccountDao.getAllAccounts(workspace_id);
		const accountIds: Record<string, string> = {}; // maps plaid account IDs to our internal account IDs

		workspaceAccounts.forEach(account => {
			if (account.plaid_account_id) {
				accountIds[account.plaid_account_id] = account.account_id;
			}
		});

		const detectionMappings = await CategoryDao.getWorkspaceDetectionMappings(workspace_id);

		for (const item of workspacePlaidItems) {
			try {
				const plaidTransactions = await this.getItemTransactions(workspace_id, item.plaid_item_id);
				const transactions = TransactionUtils.assignDateOrders(plaidTransactions.reverse().map(transaction => ({
					...transaction,
					date: ddate(transaction.date),
				})));
				for (const transaction of transactions) {
					// Look up a transaction match in DB
					const matchingTransactions = await TransactionDao.matchAllMany(workspace_id, {
						account_id: accountIds[transaction.account_id] || '',
						amount: -transaction.amount, // plaid transactions come negative!
						date: transaction.date as any,
						date_order: transaction.date_order,
					});

					// If a match is found, update the transaction with Plaid data
					if (matchingTransactions.length === 1) {
						const match = matchingTransactions[0];
						let merchant_id;
						if (asAny(transaction).merchant_entity_id && !match.merchant_id) {
							const merchant = await MerchantDao.getByPlaidMerchantId(asAny(transaction).merchant_entity_id);
							merchant_id = merchant?.merchant_id;
						}

						// Careful not to override attributes already set by the user!
						await TransactionDao.patchTransaction(workspace_id, matchingTransactions[0].transaction_id, {
							merchant_id: match.merchant_id || merchant_id || null,
							location: {
								address: match.location?.address || transaction.location?.address || '',
								city: match.location?.city || transaction.location?.city || '',
								region: match.location?.region || transaction.location?.region || '',
								postal: match.location?.postal || transaction.location?.postal as string || '',
								lat: match.location?.lat || transaction.location?.lat || null,
								lon: match.location?.lon || transaction.location?.lon || null,
							},
							plaid_data: transaction,
						});

						// Assign attribution info if the transaction has not been split
						if (match.Attributions?.length === 1) {
							const attribution = match.Attributions[0];

							const plaidCategory = transaction.personal_finance_category?.detailed;
							const plaidCategoryId = detectionMappings.find(mapping => mapping.detection_key === plaidCategory)?.category_id || null;

							// Careful not to override attributes already set by the user!
							await TransactionDao.updateTransactionAttribution(match.Attributions[0].transaction_attribution_id, {
								category_id: attribution.category_id || plaidCategoryId,
							});
						}
					}
				}
			} catch (error) {
				console.error(`Error fetching transactions for item ${item.plaid_item_id}:`, error);
			}
		}
	},
};

export const PlaidCategories = [
	"INCOME_DIVIDENDS",
	"INCOME_INTEREST_EARNED",
	"INCOME_RETIREMENT_PENSION",
	"INCOME_TAX_REFUND",
	"INCOME_UNEMPLOYMENT",
	"INCOME_WAGES",
	"INCOME_OTHER_INCOME",
	"TRANSFER_IN_CASH_ADVANCES_AND_LOANS",
	"TRANSFER_IN_DEPOSIT",
	"TRANSFER_IN_INVESTMENT_AND_RETIREMENT_FUNDS",
	"TRANSFER_IN_SAVINGS",
	"TRANSFER_IN_ACCOUNT_TRANSFER",
	"TRANSFER_IN_OTHER_TRANSFER_IN",
	"TRANSFER_OUT_INVESTMENT_AND_RETIREMENT_FUNDS",
	"TRANSFER_OUT_SAVINGS",
	"TRANSFER_OUT_WITHDRAWAL",
	"TRANSFER_OUT_ACCOUNT_TRANSFER",
	"TRANSFER_OUT_OTHER_TRANSFER_OUT",
	"LOAN_PAYMENTS_CAR_PAYMENT",
	"LOAN_PAYMENTS_CREDIT_CARD_PAYMENT",
	"LOAN_PAYMENTS_PERSONAL_LOAN_PAYMENT",
	"LOAN_PAYMENTS_MORTGAGE_PAYMENT",
	"LOAN_PAYMENTS_STUDENT_LOAN_PAYMENT",
	"LOAN_PAYMENTS_OTHER_PAYMENT",
	"BANK_FEES_ATM_FEES",
	"BANK_FEES_FOREIGN_TRANSACTION_FEES",
	"BANK_FEES_INSUFFICIENT_FUNDS",
	"BANK_FEES_INTEREST_CHARGE",
	"BANK_FEES_OVERDRAFT_FEES",
	"BANK_FEES_OTHER_BANK_FEES",
	"ENTERTAINMENT_CASINOS_AND_GAMBLING",
	"ENTERTAINMENT_MUSIC_AND_AUDIO",
	"ENTERTAINMENT_SPORTING_EVENTS_AMUSEMENT_PARKS_AND_MUSEUMS",
	"ENTERTAINMENT_TV_AND_MOVIES",
	"ENTERTAINMENT_VIDEO_GAMES",
	"ENTERTAINMENT_OTHER_ENTERTAINMENT",
	"FOOD_AND_DRINK_BEER_WINE_AND_LIQUOR",
	"FOOD_AND_DRINK_COFFEE",
	"FOOD_AND_DRINK_FAST_FOOD",
	"FOOD_AND_DRINK_GROCERIES",
	"FOOD_AND_DRINK_RESTAURANT",
	"FOOD_AND_DRINK_VENDING_MACHINES",
	"FOOD_AND_DRINK_OTHER_FOOD_AND_DRINK",
	"GENERAL_MERCHANDISE_BOOKSTORES_AND_NEWSSTANDS",
	"GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES",
	"GENERAL_MERCHANDISE_CONVENIENCE_STORES",
	"GENERAL_MERCHANDISE_DEPARTMENT_STORES",
	"GENERAL_MERCHANDISE_DISCOUNT_STORES",
	"GENERAL_MERCHANDISE_ELECTRONICS",
	"GENERAL_MERCHANDISE_GIFTS_AND_NOVELTIES",
	"GENERAL_MERCHANDISE_OFFICE_SUPPLIES",
	"GENERAL_MERCHANDISE_ONLINE_MARKETPLACES",
	"GENERAL_MERCHANDISE_PET_SUPPLIES",
	"GENERAL_MERCHANDISE_SPORTING_GOODS",
	"GENERAL_MERCHANDISE_SUPERSTORES",
	"GENERAL_MERCHANDISE_TOBACCO_AND_VAPE",
	"GENERAL_MERCHANDISE_OTHER_GENERAL_MERCHANDISE",
	"HOME_IMPROVEMENT_FURNITURE",
	"HOME_IMPROVEMENT_HARDWARE",
	"HOME_IMPROVEMENT_REPAIR_AND_MAINTENANCE",
	"HOME_IMPROVEMENT_SECURITY",
	"HOME_IMPROVEMENT_OTHER_HOME_IMPROVEMENT",
	"MEDICAL_DENTAL_CARE",
	"MEDICAL_EYE_CARE",
	"MEDICAL_NURSING_CARE",
	"MEDICAL_PHARMACIES_AND_SUPPLEMENTS",
	"MEDICAL_PRIMARY_CARE",
	"MEDICAL_VETERINARY_SERVICES",
	"MEDICAL_OTHER_MEDICAL",
	"PERSONAL_CARE_GYMS_AND_FITNESS_CENTERS",
	"PERSONAL_CARE_HAIR_AND_BEAUTY",
	"PERSONAL_CARE_LAUNDRY_AND_DRY_CLEANING",
	"PERSONAL_CARE_OTHER_PERSONAL_CARE",
	"GENERAL_SERVICES_ACCOUNTING_AND_FINANCIAL_PLANNING",
	"GENERAL_SERVICES_AUTOMOTIVE",
	"GENERAL_SERVICES_CHILDCARE",
	"GENERAL_SERVICES_CONSULTING_AND_LEGAL",
	"GENERAL_SERVICES_EDUCATION",
	"GENERAL_SERVICES_INSURANCE",
	"GENERAL_SERVICES_POSTAGE_AND_SHIPPING",
	"GENERAL_SERVICES_STORAGE",
	"GENERAL_SERVICES_OTHER_GENERAL_SERVICES",
	"GOVERNMENT_AND_NON_PROFIT_DONATIONS",
	"GOVERNMENT_AND_NON_PROFIT_GOVERNMENT_DEPARTMENTS_AND_AGENCIES",
	"GOVERNMENT_AND_NON_PROFIT_TAX_PAYMENT",
	"GOVERNMENT_AND_NON_PROFIT_OTHER_GOVERNMENT_AND_NON_PROFIT",
	"TRANSPORTATION_BIKES_AND_SCOOTERS",
	"TRANSPORTATION_GAS",
	"TRANSPORTATION_PARKING",
	"TRANSPORTATION_PUBLIC_TRANSIT",
	"TRANSPORTATION_TAXIS_AND_RIDE_SHARES",
	"TRANSPORTATION_TOLLS",
	"TRANSPORTATION_OTHER_TRANSPORTATION",
	"TRAVEL_FLIGHTS",
	"TRAVEL_LODGING",
	"TRAVEL_RENTAL_CARS",
	"TRAVEL_OTHER_TRAVEL",
	"RENT_AND_UTILITIES_GAS_AND_ELECTRICITY",
	"RENT_AND_UTILITIES_INTERNET_AND_CABLE",
	"RENT_AND_UTILITIES_RENT",
	"RENT_AND_UTILITIES_SEWAGE_AND_WASTE_MANAGEMENT",
	"RENT_AND_UTILITIES_TELEPHONE",
	"RENT_AND_UTILITIES_WATER",
	"RENT_AND_UTILITIES_OTHER_UTILITIES",
] as const;
export type PlaidCategory = (typeof PlaidCategories)[number];
