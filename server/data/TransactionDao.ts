import type { CreateTransaction, Transaction, TransactionUniqueFields } from "delfi-core/models/Transaction";
import { prisma, PrismaDao, useTransaction } from "../../prisma/client";
import { ddate } from "delfi-core/utils/dateUtils";

const commonInclude = {
	Attributions: {
		include: {
			Category: {
				include: {
					ParentCategory: true, // Include category group details
				},
			}, // Include category details
			Budget: true,
			BudgetChildItem: true, // Include budget child item details
			Tags: true, // Include tags
			Group: true, // Include group details
		},
	},
	Merchant: true,
	TransferPair: true,
	TransactionReview: {
		include: {
			ReviewedBy: true,
			AssignedTo: true,
		}
	},
};
const commonOrder: any = [
	{ pending: 'desc' }, // Show pending transactions first
	{ date: 'desc' }, // fallback on date sorting
	{ date_order: 'asc' }, // Sort by date order for transactions on the same date
];

class TransactionDaoClass extends PrismaDao {
	dbToTransaction(dbTransaction: NonNullable<Record<string, any>>): Transaction {
		return {
			...dbTransaction, // Spread the base transaction fields

			transaction_id: dbTransaction.transaction_id,
			date: ddate(dbTransaction.date),
			date_order: dbTransaction.date_order,
			authorized_date: dbTransaction.authorized_date ? ddate(dbTransaction.authorized_date) : null,
			budget_date: dbTransaction.budget_date ? ddate(dbTransaction.budget_date) : null,
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
			account_balance: dbTransaction.account_balance || null,

			merchant_id: dbTransaction.merchant_id || null,
			Merchant: dbTransaction.Merchant || null,

			transfer_pair_id: dbTransaction.transfer_pair_id || null,
			TransferPair: dbTransaction.TransferPair || null,

			Attributions: dbTransaction.Attributions?.map(attr => ({
				...attr, // Spread the base attribution fields

				transaction_attribution_id: attr.transaction_attribution_id,
				transaction_id: attr.transaction_id,
				amount: attr.amount,
				target_account_partition_id: attr.target_account_partition_id || undefined,
				category_id: attr.category_id || null,
				Category: attr.Category || null,
				memo: attr.memo || null,
				budget_id: attr.budget_id || null,
				Budget: attr.Budget || null,
				Tags: attr.Tags,
				Group: attr.Group || null,
			})),

			TransactionReview: dbTransaction.TransactionReview || null,
		};
	}

	async getMatchingTransaction(workspace_id: string, search: TransactionUniqueFields): Promise<Transaction | null> {
		const found = await this.db.transaction.findFirst({
			where: {
				workspace_id,
				account_id: search.account_id,
				original_description: search.original_description,
				amount: search.amount,
				date: search.date.toString(),
				date_order: search.date_order, // Crucial for catching transactions that look the same otherwise!
			},
		});
		return found ? this.dbToTransaction(found) : null;
	}


	async matchAllMany(workspace_id: string, search: Partial<Transaction>): Promise<Transaction[]> {
		const found = await this.db.transaction.findMany({
			where: {
				workspace_id,
				...search,
			} as any,
			include: {
				Attributions: true,
				Merchant: true,
			},
		});
		return found.map(this.dbToTransaction);
	}

	async getTransactionById(transaction_id: string): Promise<Transaction | null> {
		const found = await this.db.transaction.findUnique({
			where: {
				transaction_id,
			},
			include: commonInclude,
		});
		return found ? this.dbToTransaction(found) : null;
	}

	async getTransactionsForAccount(workspace_id: string, account_id: string): Promise<Transaction[]> {
		const transactions = await this.db.transaction.findMany({
			where: {
				workspace_id,
				account_id,
				done_pending: false,
			},
			include: commonInclude,
			orderBy: commonOrder,
			take: 100,
		});
		return transactions.map(this.dbToTransaction);
	}

	async countTransactionsForAccount(workspace_id: string, account_id: string): Promise<number> {
		return await this.db.transaction.count({
			where: {
				workspace_id,
				account_id,
			},
		});
	}

	// Specifically for searching the BUDGET date or falling back on the normal date
	async getTransactionsInRange(workspace_id: string, startDate: string, endDate: string, includePending = false): Promise<Transaction[]> {
		const transactions = await this.db.transaction.findMany({
			where: {
				workspace_id,
				pending: includePending ? undefined : false,
				done_pending: false,
				// Use normal date if budget_date is null, otherwise use budget_date
				OR: [
					{
						NOT: {
							budget_date: null,
						},
						budget_date: {
							gte: startDate,
							lte: endDate,
						},
					},
					{
						budget_date: null,
						date: {
							gte: startDate,
							lte: endDate,
						},
					}
				],
			},
			include: commonInclude,
			orderBy: commonOrder,
		});
		return transactions.map(this.dbToTransaction);
	}

	async getPendingForAccount(workspace_id: string, account_id: string): Promise<Transaction[]> {
		const transactions = await this.db.transaction.findMany({
			where: {
				workspace_id,
				account_id,
				pending: true,
				done_pending: false,
			},
			include: commonInclude,
		});
		return transactions.map(this.dbToTransaction);
	}

    async createTransaction(workspace_id: string, transactionData: CreateTransaction): Promise<Transaction> {
		// New transaction MUST have attributions totalling the whole amount
		if (!transactionData.Attributions || transactionData.Attributions.length === 0) {
			throw new Error("Transaction must have attributions");
		}
		await this.verifyAttributionsTotal(transactionData, transactionData.Attributions);

		const created = await this.db.transaction.create({
            data: {
    			amount: transactionData.amount,
    			date: ddate(transactionData.date).toString(),
				date_order: transactionData.date_order || null, // For sorting transactions from the same date
    			authorized_date: transactionData.authorized_date?.toString(),
    			budget_date: transactionData.budget_date?.toString(),
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

				account_balance: transactionData.account_balance || null,

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

				Workspace: {
					connect: {
						workspace_id,
					},
				},
            },
        });

		await this.setAllAttributionsForTransaction(created.transaction_id, transactionData.Attributions);

		return this.dbToTransaction((await this.getTransactionById(created.transaction_id))!);
    }

	async patchTransaction(workspace_id: string, transaction_id: string, transactionData: Partial<Transaction>): Promise<Transaction> {		
		const transaction = await this.getTransactionById(transaction_id);
		if (!transaction) {
			throw new Error("Transaction not found");
		}

		// Update attributions
		if (transactionData.Attributions) {
			await this.verifyAttributionsTotal(transactionData, transactionData.Attributions || []);
			await this.setAllAttributionsForTransaction(transaction_id, transactionData.Attributions);
		}

		await this.db.transaction.update({
			where: {
				transaction_id,
				workspace_id,
			},
			// LEAVE THE DATA UNDEFINED IF NOT PROVIDED TO NOT OVERWRITE IT
			data: {
				date_order: transactionData.date_order, // For sorting transactions from the same date
				authorized_date: transactionData.authorized_date?.toString(),
				budget_date: transactionData.budget_date?.toString(),
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
				plaid_data: transactionData.plaid_data,
				account_balance: transactionData.account_balance,
			},
		});


		const updated = await this.getTransactionById(transaction_id);
		return updated!;
	}

	async verifyAttributionsTotal(transactionData: { amount?: number, transaction_id?: string }, attributions: NonNullable<CreateTransaction["Attributions"]>) {
		let amount = transactionData.amount;
		if (!('amount' in transactionData)) {
			if (!transactionData.transaction_id) {
				console.error("Cannot lookup transaction amount", transactionData);
				throw new Error("Cannot lookup transaction amount without transaction ID" );
			}
			// Fetch the transaction to get the amount
			const transaction = await this.getTransactionById(transactionData.transaction_id);
			if (!transaction) {
				throw new Error("Transaction not found for ID: " + transactionData.transaction_id);
			}
			amount = transaction.amount;
		}
		const attributionTotal = attributions.reduce((sum, attr) => sum + attr.amount, 0);
		if (attributionTotal !== amount) {
			console.error(`Attributions do not add to ${amount}`, attributions.map(a => a.amount), "total:", attributionTotal);
			throw new Error("Attributions must total the transaction amount");
		}
	}

	async setAllAttributionsForTransaction(transaction_id: string, attributions: NonNullable<CreateTransaction["Attributions"]>) {
		// delete all prior attributions
		await this.db.transactionAttribution.deleteMany({
			where: {
				transaction_id,
			},
		});

		// create new attributions
		await this.db.transactionAttribution.createMany({
			data: attributions.map(attr => ({
				transaction_id,
				amount: attr.amount,
				target_account_partition_id: attr.target_account_partition_id || undefined,
				category_id: attr.category_id || null,
				memo: attr.memo || null,
				budget_id: attr.budget_id || null,
				budget_child_item_id: attr.budget_child_item_id || null,
				group_id: attr.group_id || null,
				// Tags: attr.Tags ? {
				// 	connect: attr.Tags.map(tag => ({ tag_id: tag.tag_id })),
				// } : undefined,
			})),
		});
	}

	async bulkPatchAttributionValues(
		workspace_id: string,
		attributionIds: string[],
		updates: Partial<{ budget_id: string | null, budget_child_item_id: string | null, category_id: string | null, group_id: string | null }>
	): Promise<Transaction[]> {
		// Verify all attributions belong to this workspace, then update
		const attributions = await this.db.transactionAttribution.findMany({
			where: {
				transaction_attribution_id: { in: attributionIds },
				Transaction: { workspace_id },
			},
			select: { transaction_attribution_id: true, transaction_id: true },
		});

		if (attributions.length !== attributionIds.length) {
			throw new Error('One or more attributions not found or not accessible');
		}

		await this.db.transactionAttribution.updateMany({
			where: { transaction_attribution_id: { in: attributionIds } },
			data: updates,
		});

		const uniqueTransactionIds = [...new Set(attributions.map(a => a.transaction_id))];
		return Promise.all(uniqueTransactionIds.map(id => this.getTransactionById(id).then(t => t!)));
	}

	async updateTransactionAttribution(
		transaction_attribution_id: string,
		attributionUpdates: any
	) {
		// Do NOT update amount! Amounts can only be updated all at the same time so they are verified
		await this.db.transactionAttribution.update({
			where: {
				transaction_attribution_id,
			},
			data: {
				category_id: attributionUpdates.category_id,
			},
		});
	}

	async setTransferPair(workspace_id: string, t1_id: string, t2_id: string) {
		// First make sure they are compatible!
		const t1 = await this.db.transaction.findUnique({
			where: {
				transaction_id: t1_id,
				workspace_id,
			},
			include: {
				Attributions: true,
			},
		});
		const t2 = await this.db.transaction.findUnique({
			where: {
				transaction_id: t2_id,
				workspace_id,
			},
			include: {
				Attributions: true,
			},
		});

		if (!t1 || !t2) {
			throw new Error("One or both transactions not found");
		}
		if (t1.amount !== -t2.amount) {
			throw new Error("Transaction amounts must be equal and opposite");
		}
		if (t1.account_id === t2.account_id) {
			throw new Error("Transactions must be from different accounts");
		}

		// DETERMINE IS THIS PAIR ALREADY EXISTS!
		// If it does, we will simply write T1 attribution data into T2
		// But if not, we will merge data from both together.
		let isNewPairing = false;
		if (t1.transfer_pair_id === t2.transaction_id) {
			isNewPairing = true;
		}

		await this.db.transaction.update({
			where: {
				transaction_id: t1_id,
			},
			data: {
				TransferPair: {
					connect: { transaction_id: t2_id },
				},
			},
		});
		
		await this.db.transaction.update({
			where: {
				transaction_id: t2_id,
			},
			data: {
				TransferPair: {
					connect: { transaction_id: t1_id },
				},
			},
		});


		// let there be only one attribution
		// Merge data from both if this is a new pairing, not editing an existing pairing.
		const attrAttrs = {
			category_id: t1.Attributions[0].category_id || (isNewPairing ? t2.Attributions[0]?.category_id : null),
			memo: t1.Attributions[0].memo || (isNewPairing ? t2.Attributions[0]?.memo : null),
			budget_id: t1.Attributions[0].budget_id || (isNewPairing ? t2.Attributions[0]?.budget_id : null),
			budget_child_item_id: t1.Attributions[0].budget_child_item_id || (isNewPairing ? t2.Attributions[0]?.budget_child_item_id : null),
			group_id: t1.Attributions[0].group_id || (isNewPairing ? t2.Attributions[0]?.group_id : null),
		};
		await this.setAllAttributionsForTransaction(t1_id, [{
			...attrAttrs as any,
			amount: t1.amount,
		}]);
		await this.setAllAttributionsForTransaction(t2_id, [{
			...attrAttrs as any,
			amount: t2.amount,
		}]);
	}

	async breakTransferPair(workspace_id: string, t1_id: string, t2_id: string): Promise<void> {
		// Break the transfer pair
		await this.db.transaction.update({
			where: {
				transaction_id: t1_id,
				workspace_id,
			},
			data: {
				TransferPair: {
					disconnect: {
						transaction_id: t2_id,
					},
				},
			},
		});

		await this.db.transaction.update({
			where: {
				transaction_id: t2_id,
				workspace_id,
			},
			data: {
				TransferPair: {
					disconnect: {
						transaction_id: t1_id,
					},
				},
			},
		});
	}


	async findPotentialTransferPairs(workspace_id: string, transaction: Transaction): Promise<Transaction[]> {
		if (transaction.TransferPair) {
			return []; // Already paired
		}
		const potentialPairs = await this.db.transaction.findMany({
			where: {
				workspace_id,
				account_id: {
					not: transaction.account_id,
				},
				amount: -transaction.amount,
				// for now, only consider those on the same day
				date: transaction.date.toString(),
				pending: false,
				transfer_pair_id: null,
				done_pending: false,
			},
			include: commonInclude,
		});
		return potentialPairs.map(this.dbToTransaction);
	}

	async deleteTransaction(workspace_id: string, transaction_id: string): Promise<void> {
		await this.db.transaction.delete({
			where: {
				transaction_id,
				workspace_id,
			},
		});
	}
};

export const TransactionDao = new TransactionDaoClass();
