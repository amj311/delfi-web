// SETUP PLAID
import { Configuration, CountryCode, PlaidApi, PlaidEnvironments, Products } from 'plaid';
import { prisma } from '../../prisma/client';
import dayjs from 'dayjs';

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
	async getLinkToken(userId = 'user-id', redirect_uri = null)  {
		// Create a link token with more configurations
		const { data } = await plaid.linkTokenCreate({
			client_id: PLAID_CLIENT_ID,
			secret: PLAID_SECRET,
			products: PLAID_PRODUCTS,
			client_name: 'Delfi',
			language: 'en',
			country_codes: [CountryCode.Us],
			user: {
				client_user_id: userId,
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

	async getLinkTokenForItemUpdate(itemId) {
		// Create a link token specifically for updating an existing item
		try {
			// First, check if we have the item in our database
			const plaidItem = await prisma.plaidItem.findFirst({
				where: { plaid_item_id: itemId }
			});

			if (!plaidItem) {
				throw new Error(`Item with ID ${itemId} not found in database`);
			}

			// Create a link token with update mode enabled
			const { data } = await plaid.linkTokenCreate({
				client_id: PLAID_CLIENT_ID,
				secret: PLAID_SECRET,
				// No products array needed in update mode
				client_name: 'Delfi',
				language: 'en',
				country_codes: [CountryCode.Us],
				user: {
					client_user_id: 'user-id', // You may want to use a real user ID here
				},
				...(PLAID_WEBHOOK_URL ? { webhook: PLAID_WEBHOOK_URL } : {}),
				link_customization_name: 'default',
				access_token: plaidItem.access_token, // This is important for update mode
				update: {
					account_selection_enabled: true // Allow selecting accounts again if needed
				}
			});

			return data;
		} catch (error) {
			console.error('Error creating link token for item update:', error);
			throw error;
		}
	},

	async saveNewConnection(user_id, public_token)  {
		const { data } = await plaid.itemPublicTokenExchange({
			client_id: PLAID_CLIENT_ID,
			secret: PLAID_SECRET,
			public_token
		});
		const { access_token } = data;
		const { data: { accounts, item } } = await plaid.accountsBalanceGet({ access_token });
		console.log("got accounts", accounts)
		try {
			const res = await prisma.plaidItem.create({
				data: {
					plaid_item_id: item.item_id,
					access_token,
					institution_id: item.institution_id,
					accounts: {
						create: accounts.map(a => ({
							display_name: "",
							external_name: a.name,
							external_account_id: a.account_id,
							mask: a.mask,
							type: a.type.toString() || '',
							subtype: a.subtype?.toString() || '',
							current_balance: a.balances.current,
							available_balance: a.balances.available,
							iso_currency_code: a.balances.iso_currency_code,
							User: { connect: {
								user_id, // Replace with actual user ID if available
							} }
						}))
					}
				}
			})
			console.log(res)
		}
		catch (e) {
			console.log(e)
		}
		
		return data;
	},

	/**
	 * Create a link token to re-authenticate an item when access token is not available
	 * This can be used when the access token is no longer saved in the database
	 * The user will need to go through the Plaid authentication flow again
	 */
	async createLinkTokenForReauthentication(itemId) {
		try {
			// Create a link token specifically for re-authenticating an existing item
			const { data } = await plaid.linkTokenCreate({
				client_id: PLAID_CLIENT_ID,
				secret: PLAID_SECRET,
				client_name: 'Delfi',
				language: 'en',
				country_codes: [CountryCode.Us],
				user: {
					client_user_id: 'user-id', // You may want to use a real user ID here
				},
				...(PLAID_WEBHOOK_URL ? { webhook: PLAID_WEBHOOK_URL } : {}),
				link_customization_name: 'default',
				// When re-authenticating without an access token, we use the item_id 
				// to help Plaid identify the correct financial institution
				institution_id: '', // Optional: Add institution ID if you know it
				// For update mode with item id
				update: {
					// This field enables account selection in update mode
					account_selection_enabled: true
				}
			});

			return data;
		} catch (error) {
			console.error('Error creating link token for re-authentication:', error);
			throw error;
		}
	},

	/**
	 * After re-authentication using the link token, save the new access token
	 * This function should be called once the user completes the re-authentication flow
	 * and you receive a new public_token
	 */
	async saveReauthenticatedItem(itemId, publicToken) {
		try {
			// Exchange the public token for an access token
			const { data } = await plaid.itemPublicTokenExchange({
				client_id: PLAID_CLIENT_ID,
				secret: PLAID_SECRET,
				public_token: publicToken
			});
			
			const { access_token, item_id } = data;
			
			// Update the item in the database with the new access token
			await prisma.plaidItem.update({
				where: { plaid_item_id: itemId },
				data: { access_token }
			});
			
			// Verify the access token works by getting account information
			const accountsResponse = await plaid.accountsGet({ access_token });
			
			return {
				success: true,
				item_id,
				accounts: accountsResponse.data.accounts
			};
		} catch (error) {
			console.error('Error saving re-authenticated item:', error);
			throw error;
		}
	},
	
	/**
	 * Get transactions using the transactions/sync endpoint
	 * This requires a valid access token
	 */
	async syncTransactions(itemId) {
		try {
			// First get the access token for the item
			const plaidItem = await prisma.plaidItem.findFirst({
				where: { plaid_item_id: itemId }
			});

			if (!plaidItem || !plaidItem.access_token) {
				throw new Error(`Access token for item ${itemId} not found. Item needs re-authentication.`);
			}

			// Call the transactions/sync endpoint with an empty cursor for initial sync
			const response = await plaid.transactionsSync({
				access_token: plaidItem.access_token,
				// Use empty string for initial sync instead of null to avoid type errors
				cursor: '',
			});

			return response.data;
		} catch (error) {
			console.error('Error syncing transactions:', error);
			throw error;
		}
	},

	/**
	 * Get transactions for a specific account
	 * This fetches all transactions for the account using the access token for the item
	 */
	async getAccountTransactions(accountId) {
		try {
			// First find the account to get its external ID and plaid_item_id
			const account = await prisma.account.findUnique({
				where: { account_id: accountId }
			});

			if (!account || !account.external_account_id) {
				throw new Error(`Account ${accountId} not found or not properly connected to Plaid.`);
			}

			if (!account.plaid_item_id) {
				throw new Error(`Plaid Item ID for account ${accountId} not available.`);
			}
			
			// Get the plaid item to get the access token
			const plaidItem = await prisma.plaidItem.findUnique({
				where: { plaid_item_id: account.plaid_item_id }
			});
			
			if (!plaidItem || !plaidItem.access_token) {
				throw new Error(`Access token for account ${accountId} not available. Item needs re-authentication.`);
			}

			// Call the transactions/sync endpoint and collect all batches
			let cursor = '';
			let hasMore = true;
			let allAdded = [] as Array<Awaited<ReturnType<typeof plaid.transactionsSync>>['data']['added'][number]>;
			let allModified = [] as Array<Awaited<ReturnType<typeof plaid.transactionsSync>>['data']['modified'][number]>;
			let allRemoved = [] as Array<Awaited<ReturnType<typeof plaid.transactionsSync>>['data']['removed'][number]>;

			while (hasMore) {
				const {data: batchResponse} = await plaid.transactionsGet({
					access_token: plaidItem.access_token,
					start_date: dayjs().subtract(1, 'year').format('YYYY-MM-DD'), // Fetch last year of transactions
					end_date: dayjs().format('YYYY-MM-DD'),
				});
				
				// Accumulate transactions
				allAdded = [...allAdded, ...batchResponse.transactions];
				// allModified = [...allModified, ...batchResponse.data.modified];
				// allRemoved = [...allRemoved, ...batchResponse.data.removed];
				
				// Update cursor and hasMore for next iteration
				hasMore = false;
				// cursor = batchResponse.data.next_cursor;
			}

			// Create a consolidated response object
			const response = {
				data: {
					added: allAdded,
					modified: allModified,
					removed: allRemoved,
				}
			};

			console.log('Fetched transactions:', response.data.added.length);

			// Filter transactions for just this account
			const accountTransactions = response.data.added.filter(
				transaction => transaction.account_id === account.external_account_id
			)

			return {
				success: true,
				transactions: accountTransactions
			};
		} catch (error) {
			console.error('Error fetching account transactions:', error);
			throw error;
		}
	},
	// No duplicate functions here
};
