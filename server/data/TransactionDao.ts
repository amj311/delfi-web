import type { CreateTransaction, Transaction, TransactionUniqueFields } from "delfi-core/models/Transaction";
import { prisma } from "../../prisma/client";
import { date } from "delfi-core/utils/dateUtils";

export const TransactionDao = {
	dbToTransaction(dbTransaction: NonNullable<Record<string, any>>): Transaction {
		return {
			transaction_id: dbTransaction.transaction_id,
			date: date(dbTransaction.date),
			authorized_date: dbTransaction.authorized_date ? date(dbTransaction.authorized_date) : null,
			amount: dbTransaction.amount,
			original_description: dbTransaction.original_description,
			pending: dbTransaction.pending || false,
			done_pending: dbTransaction.done_pending || false,
			iso_currency_code: dbTransaction.iso_currency_code || undefined,
			notes: dbTransaction.notes || undefined,
			location: {
				address: dbTransaction.location_address || undefined,
				city: dbTransaction.location_city || undefined,
				region: dbTransaction.location_region || undefined,
				postal: dbTransaction.location_postal || undefined,
				lat: dbTransaction.location_lat || undefined,
				lon: dbTransaction.location_lon || undefined,
			},
			source: dbTransaction.source,
			source_id: dbTransaction.source_id || null,
			source_data: dbTransaction.source_data || null,
			workspace_id: dbTransaction.workspace_id,

			account_id: dbTransaction.account_id,

			merchant_id: dbTransaction.merchant_id || null,
			Merchant: dbTransaction.Merchant || null,

			Attributions: dbTransaction.Attributions?.map(attr => ({
				transaction_attribution_id: attr.transaction_attribution_id,
				transaction_id: attr.transaction_id,
				amount: attr.amount,
				target_account_partition_id: attr.target_account_partition_id || undefined,
				category_id: attr.category_id || null,
				Category: attr.Category || null,
				tagIds: attr.tagIds || [],
				memo: attr.memo || null,
				budget_id: attr.budget_id || null,
			})),
		};
	},

	async getMatchingTransaction(workspace_id: string, search: TransactionUniqueFields): Promise<Transaction | null> {
		const found = await prisma.transaction.findFirst({
			where: {
				workspace_id,
				account_id: search.account_id,
				original_description: search.original_description,
				amount: search.amount,
				date: date(search.date).toString(),
				source_id: search.source_id || undefined,
			},
		});
		return found ? this.dbToTransaction(found) : null;
	},


	async matchAllMany(search: Partial<Transaction>): Promise<Transaction[]> {
		const found = await prisma.transaction.findMany({
			where: {
				...search,
			} as any,
			include: {
				Attributions: true,
				Merchant: true,
			},
		});
		return found.map(this.dbToTransaction);
	},

	async getTransactionsForAccount(workspace_id: string, account_id: string): Promise<Transaction[]> {
		const transactions = await prisma.transaction.findMany({
			where: {
				workspace_id,
				account_id,
				done_pending: false,
			},
			include: {
				Attributions: {
					include: {
						Category: {
							include: {
								Group: true, // Include category group details
							},
						}, // Include category details
					},
				},
				Merchant: true,
			},
			orderBy: [
				{ pending: 'desc' }, // Show pending transactions first
				{ date: 'desc' },
			]
		});
		return transactions.map(this.dbToTransaction);
	},

	async getPendingForAccount(workspace_id: string, account_id: string): Promise<Transaction[]> {
		const transactions = await prisma.transaction.findMany({
			where: {
				workspace_id,
				account_id,
				pending: true,
				done_pending: false,
			},
			include: {
				Attributions: true,
				Merchant: true,
			},
		});
		return transactions.map(this.dbToTransaction);
	},

    async createTransaction(workspace_id: string, transactionData: CreateTransaction): Promise<Transaction> {
		// New transaction MUST have attributions totalling the whole amount
		if (!transactionData.Attributions || transactionData.Attributions.length === 0) {
			throw new Error("Transaction must have attributions");
		}

		const created = await prisma.transaction.create({
            data: {
    			amount: transactionData.amount,
    			date: transactionData.date.toString(),
    			authorized_date: transactionData.authorized_date?.toString(),
    			iso_currency_code: transactionData.iso_currency_code,
    			notes: transactionData.notes,
    			original_description: transactionData.original_description,
    			pending: transactionData.pending || false,
				done_pending: transactionData.done_pending || false,
    			location_address: transactionData.location?.address,
    			location_lat: transactionData.location?.lat,
    			location_lon: transactionData.location?.lon,
    			location_city: transactionData.location?.city,
    			location_region: transactionData.location?.region,
    			location_postal: transactionData.location?.postal,

    			source: transactionData.source,
    			source_id: transactionData.source_id,
    			source_data: transactionData.source_data,

    			Account: {
					connect: {
						account_id: transactionData.account_id,
					},
				},

    			Merchant: transactionData.merchant_id ? {
					connect: {
						merchant_id: transactionData.merchant_id,
					},
				} : undefined,


				Attributions: {
					create: transactionData.Attributions.map(attr => ({
						...attr,
					})),
				},
				Workspace: {
					connect: {
						workspace_id,
					},
				},
            },
        });

		return this.dbToTransaction(created);
    },

	async updateTransaction(workspace_id: string, transaction_id: string, transactionData: Partial<CreateTransaction>): Promise<Transaction> {
		const updated = await prisma.transaction.update({
			where: {
				transaction_id,
				workspace_id,
			},
			data: {
				notes: transactionData.notes,
				pending: transactionData.pending,
				done_pending: transactionData.done_pending,
				location_address: transactionData.location?.address,
				location_lat: transactionData.location?.lat,
				location_lon: transactionData.location?.lon,
				location_city: transactionData.location?.city,
				location_region: transactionData.location?.region,
				location_postal: transactionData.location?.postal,
				merchant_id: transactionData.merchant_id,
			},
		});

		return this.dbToTransaction(updated);
	},

	async updateTransactionAttribution(
		transaction_attribution_id: string,
		attributionUpdates: any
	) {
		// Do NOT update amount! Amounts can only be updated all at the same time so they are verified
		await prisma.transactionAttribution.update({
			where: {
				transaction_attribution_id,
			},
			data: {
				category_id: attributionUpdates.category_id,
			},
		});

	},

	async deleteTransaction(workspace_id: string, transaction_id: string): Promise<void> {
		await prisma.transaction.delete({
			where: {
				transaction_id,
				workspace_id,
			},
		});
	},
};
