import { TransactionUtils, type Merchant, type MerchantDraft, type Transaction } from "delfi-core/models/Transaction";
import { MerchantDao } from "server/data/MerchantDao";
import CompanySearchService from "./CompanySearchService";
import axios from "axios";
import { TransactionRuleDao } from "server/data/TransactionRuleDao";


export default class MerchantService {
    public static async createWorkspaceMerchant(merchantData: Omit<Merchant, 'merchant_id'>) {
        // return await prisma.merchant.create({
        //     data: merchantData,
        // });
    }

	// TODO: this will need pagination eventually
    public static async getWorkspaceMerchants(workspace_id: string) {
		return await MerchantDao.getAllMerchants(workspace_id);
    }

	/**
	 * Receives new transactions for which a known merchant was not identified.
	 * Searches the web for merchants that match the transaction description.
	 * Checks known merchants for a match, to update the auto-assigning rules if needed.
	 * Creates new merchants if no existing match is found.
	 */
	public static async searchForTransactionMerchants(transactions: Array<Transaction>) {
		// Small efficiency gain: group transaction that look like they could be the same merchant
		// so we don't have to repeat the same search for each transaction.
		const identifiersAndTransactions = transactions.reduce((acc, tx) => {
			const details = TransactionUtils.extractDescriptionInfo(tx.original_description);
			const identifier = details?.identifier_name || details?.identifier_full || '';
			const transactions: Array<Transaction> = acc.get(identifier) || [];
			transactions.push(tx);
			acc.set(identifier, transactions);
			return acc;
		}, new Map<string, Array<Transaction>>());

		const results = await Promise.all(Array.from(identifiersAndTransactions.entries()).map(async ([identifier, transactions]) => {
			if (!identifier) {
				return; // Skip empty identifiers
			}

			try {
				const bestWebsite = await CompanySearchService.doCompanySearch(identifier);
				if (!bestWebsite) {
					console.warn(`No website found for identifier: ${identifier}`);
					return;
				}
				console.log(`Best website found for ${identifier}:`, bestWebsite);

				// Lookup existing merchant by hostname
				const existingMerchant = await MerchantDao.getMerchantByHostname(bestWebsite.hostname);
				if (existingMerchant) {
					console.log(`Found existing merchant for ${identifier}:`, existingMerchant);
					return { merchant: existingMerchant, transactions, identifier };
				}

				// Load website HTML and find icons
				const { data } = await axios.get(bestWebsite.origin);
				const html = data as string;

				const nameFromHtml = CompanySearchService.extractNameFromHtml(html, identifier);
				let logoPath = CompanySearchService.extractLogoFromHtml(html);
				if (logoPath && !logoPath.startsWith('http')) {
					logoPath = new URL(logoPath, bestWebsite.origin).href; // Make absolute URL
				}

				// Create new merchant
				const newMerchant: MerchantDraft = {
					name: nameFromHtml || identifier,
					hostname: bestWebsite.hostname,
					logo: logoPath || null,
				};
				const createdMerchant = await MerchantDao.createMerchant(newMerchant);
				console.log(`Created new merchant for ${identifier}:`, createdMerchant);
				return { merchant: createdMerchant, transactions, identifier };
			}
			catch (error) {
				console.error(`Error searching for merchant for identifier "${identifier}":`, error);
				return; // Skip this identifier on error
			}

		}));

		const successfulResults = results.filter(result => !!result);
		// Create new rules to auto-assign these merchants in the future
		await Promise.all(successfulResults.map(async ({ merchant, identifier }) => {
			await TransactionRuleDao.createTransactionRule({
				filter: [{ property: 'Transaction.original_description', operator: 'inc', operand: identifier }],
				actions: [{ action: 'merchant_id', value: merchant.merchant_id }]
			})
		}));

		return successfulResults;
	}

    public static async getMerchantById(workspace_id: string, merchant_id: string) {
        // return await prisma.workspaceDefinedMerchant.findUnique({
        //     where: {
        //         merchant_id,
		// 		workspace_id,
        //     },
        // });
    }

    public static async updateMerchant(workspace_id: string, merchant_id: string, merchantData: Partial<Merchant>) {
        // return await prisma.workspaceDefinedMerchant.update({
        //     where: {
        //         merchant_id,
		// 		workspace_id,
        //     },
        //     data: merchantData,
        // });
    }

    public static async deleteMerchant(workspace_id, merchant_id: string) {
        // await prisma.workspaceDefinedMerchant.delete({
        //     where: {
        //         merchant_id,
		// 		workspace_id,
        //     },
        // });
    }
};