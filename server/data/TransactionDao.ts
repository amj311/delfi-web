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
			pending: dbTransaction.pending,
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

			target_account_id: dbTransaction.account_id,

			merchant_id: dbTransaction.merchant_id || null,

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

	async getMatchingTransaction(user_id: string, search: TransactionUniqueFields): Promise<Transaction | null> {
		const found = await prisma.transaction.findFirst({
			where: {
				user_id,
				account_id: search.target_account_id,
				original_description: search.original_description,
				amount: search.amount,
				date: date(search.date).toDate(),
				source_id: search.source_id || undefined,
			},
		});
		return found ? this.dbToTransaction(found) : null;
	},

	async getPendingForAccount(user_id: string, account_id: string): Promise<Transaction[]> {
		const transactions = await prisma.transaction.findMany({
			where: {
				user_id,
				account_id,
				pending: true,
			},
			include: {
				Attributions: true,
				Merchant: true,
			},
		});
		return transactions.map(this.dbToTransaction);
	},

    async createTransaction(user_id: string, transactionData: CreateTransaction): Promise<Transaction> {
		// New transaction MUST have attributions totalling the whole amount
		if (!transactionData.Attributions || transactionData.Attributions.length === 0) {
			throw new Error("Transaction must have attributions");
		}

		const created = await prisma.transaction.create({
            data: {
    			amount: transactionData.amount,
    			date: transactionData.date.toDate(),
    			authorized_date: transactionData.authorized_date?.toDate(),
    			iso_currency_code: transactionData.iso_currency_code,
    			notes: transactionData.notes,
    			original_description: transactionData.original_description,
    			pending: transactionData.pending,
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
						account_id: transactionData.target_account_id,
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
				User: {
					connect: {
						user_id,
					},
				},
            },
        });

		return this.dbToTransaction(created);
    },

	async updateTransaction(user_id: string, transaction_id: string, transactionData: Partial<CreateTransaction>): Promise<Transaction> {
		const updated = await prisma.transaction.update({
			where: {
				transaction_id,
				user_id,
			},
			data: {
				notes: transactionData.notes,
				pending: transactionData.pending,
				location_address: transactionData.location?.address,
				location_lat: transactionData.location?.lat,
				location_lon: transactionData.location?.lon,
				location_city: transactionData.location?.city,
				location_region: transactionData.location?.region,
				location_postal: transactionData.location?.postal,
			},
		});

		return this.dbToTransaction(updated);
	},

	async deleteTransaction(user_id: string, transaction_id: string): Promise<void> {
		await prisma.transaction.delete({
			where: {
				transaction_id,
				user_id,
			},
		});
	},
};
