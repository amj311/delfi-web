// SETUP PLAID
import { Configuration, CountryCode, PlaidApi, PlaidEnvironments, Products } from 'plaid';
import { prisma } from '../../prisma/client';
var dayjs = require('dayjs')

const {
	PLAID_CLIENT_ID,
	PLAID_SECRET
} = process.env;

var PLAID_ENV = 'sandbox';
const PLAID_PRODUCTS = [
	Products.Transactions,
	Products.Investments,
	Products.Liabilities
];

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET,
    },
  },
});

const plaid = new PlaidApi(configuration);

export const PlaidService = {
	async getLinkToken()  {
		const { data } = await plaid.linkTokenCreate({
			client_id: PLAID_CLIENT_ID,
			secret: PLAID_SECRET,
			products: PLAID_PRODUCTS,
			client_name: 'Delfi',
			language: 'en',
			country_codes: [CountryCode.Us],
			user: {
				client_user_id: 'user-id',
			}
		});
		return data;
	},

	async saveNewConnection(public_token)  {
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
							custom_name: null,
							external_name: a.name,
							external_account_id: a.account_id,
							mask: a.mask,
							type: a.type.toString() || '',
							subtype: a.subtype?.toString() || '',
							current_balance: a.balances.current,
							available_balance: a.balances.available,
							iso_currency_code: a.balances.iso_currency_code,
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
	}
};
