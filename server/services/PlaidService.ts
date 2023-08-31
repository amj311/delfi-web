// SETUP PLAID
import { Configuration, CountryCode, PlaidApi, PlaidEnvironments, Products } from 'plaid';
var dayjs = require('dayjs')

var PLAID_CLIENT_ID = '5d0690004635d60014d9ea4e'
var PLAID_SECRET = '9a2723cb459bd58c6c204679cd62d7'
var PLAID_PUBLIC_KEY = 'a83ad803a5d4424db1cb75d5fdc2bf'
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
	}
}