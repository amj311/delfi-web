// SETUP PLAID
import { Configuration, CountryCode, PlaidApi, PlaidEnvironments, Products } from 'plaid';
var dayjs = require('dayjs')

const {
	PLAID_CLIENT_ID,
	PLAID_SECRET
 } = process.env;

var PLAID_ENV = 'sandbox';
const PLAID_PRODUCTS = [Products.Transactions];

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET,
    },
  },
});

const client = new PlaidApi(configuration);

const PLAID_ACCESS = 'access-sandbox-4747bf96-46b4-40eb-a0c1-d5bc3189f8d2';
const PLAID_ITEMID = 'wjQPEwk33XtGQellX9y8FDDV6aN86vCrpWxPa';


console.log(process.env)

export const PlaidService = {
	async getLinkToken()  {
		const { data } = await client.linkTokenCreate({
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

	async exchangePublicToken(public_token)  {
		const { data } = await client.itemPublicTokenExchange({
			client_id: PLAID_CLIENT_ID,
			secret: PLAID_SECRET,
			public_token
		});
		return data;
	}
};
