import { TransactionUtils, type Merchant, type MerchantDraft, type Transaction } from "delfi-core/models/Transaction";
import { MerchantDao } from "server/data/MerchantDao";
import CompanySearchService from "./CompanySearchService";
import axios from "axios";
import { TransactionRuleDao } from "server/data/TransactionRuleDao";

type MerchantSearchResult = {
	existingMerchant?: Merchant,
	newMerchant?: MerchantDraft,
	transactions: Array<Transaction>,
	identifier: string,
}

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
	 */
	public static async searchForTransactionMerchants(transactions: Array<Transaction>) {
		// Small efficiency gain: group transaction that look like they could be the same merchant
		// so we don't have to repeat the same search for each transaction.
		const identifiersAndTransactions = transactions.reduce((acc, tx) => {
			const details = TransactionUtils.extractDescriptionInfo(tx.original_description);
			const identifier = details?.merchant_name || details?.simple_description || '';
			const transactions: Array<Transaction> = acc.get(identifier) || [];
			transactions.push(tx);
			acc.set(identifier, transactions);
			return acc;
		}, new Map<string, Array<Transaction>>());

		const results: Array<MerchantSearchResult | void> = await Promise.all(Array.from(identifiersAndTransactions.entries()).map(async ([identifier, transactions]) => {
			if (!identifier) {
				return; // Skip empty identifiers
			}

			try {
				// also search location to improve accuracy
				const firstTransactionBreakdown = TransactionUtils.extractDescriptionInfo(transactions[0].original_description);
				const location = firstTransactionBreakdown?.location_full || `${firstTransactionBreakdown?.location_city || ''} ${firstTransactionBreakdown?.location_region || ''}`.trim();
				const bestWebsite = await CompanySearchService.doCompanySearch(identifier, location);

				if (!bestWebsite) {
					console.warn(`No website found for identifier: ${identifier}`);
					return;
				}

				console.log(`Best website for "${identifier}":`, bestWebsite.origin);

				// Lookup existing merchant by hostname
				const existingMerchant = await MerchantDao.getMerchantByHostname(bestWebsite.hostname);
				if (existingMerchant) {
					console.log(`Found existing merchant for ${identifier}:`, existingMerchant);
					return { existingMerchant, transactions, identifier };
				}

				// Load website HTML and find icons
				const websiteData = await CompanySearchService.extractWebsiteData(bestWebsite);

				const bestName = CompanySearchService.chooseBestName([...websiteData.nameCandidates, identifier], identifier);
				let logoPath = websiteData.logo;

				// Create new merchant
				let newMerchant: MerchantDraft = {
					name: bestName || identifier,
					hostname: bestWebsite.hostname,
					logo: logoPath || null,
				};
				console.log(`Returning new merchant for ${identifier}:`, newMerchant);
				return { newMerchant, transactions, identifier };
			}
			catch (error) {
				console.error(`Error searching for merchant for identifier "${identifier}":`, error);
				return; // Skip this identifier on error
			}
		}));

		let successfulResults = results.filter(result => !!result);

		// if (save) {
		// 	// Create new rules to auto-assign these merchants in the future
		// 	successfulResults = await Promise.all(successfulResults.map(async (entry) => {
		// 		const createdMerchant = await MerchantDao.createMerchant('', entry.merchant);
		// 		await TransactionRuleDao.createTransactionRule({
		// 			filter: [{ property: 'Transaction.original_description', operator: 'inc', operand: entry.identifier }],
		// 			actions: [{ action: 'merchant_id', value: createdMerchant.merchant_id }]
		// 		})
		// 		return {
		// 			...entry,
		// 			createdMerchant: createdMerchant,
		// 		}
		// 	}));
		// }

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

    public static async updateMerchant(workspace_id: string, merchant_id: string, merchantData: Merchant) {
        return await MerchantDao.updateMerchant(merchant_id, merchantData);
    }
};