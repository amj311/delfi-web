import { TransactionUtils, type CreateTransaction, type Transaction } from "delfi-core/models/Transaction";
import { ddate, type DelfiDate } from "delfi-core/utils/dateUtils";
import { TransactionDao } from "server/data/TransactionDao";
import { TransactionRuleService } from "./TransactionRuleService";
import MerchantService from "./MerchantService";
import { TransactionReviewDao } from "server/data/TransactionReviewDao";

export class TransactionService {
	private static async createTransaction(workspace_id: string, transactionData: CreateTransaction) {
		// New transaction MUST have attributions totalling the whole amount
		if (!transactionData.Attributions || transactionData.Attributions.length === 0) {
			transactionData.Attributions = [{
				amount: transactionData.amount,
				category_id: null,
			}];
		}
		const attributionTotal = transactionData.Attributions!.reduce((sum, attr) => sum + attr.amount, 0);
		if (attributionTotal !== transactionData.amount) {
			throw new Error("Attributions must total the transaction amount");
		}

		const determinedAuthorizedDate = this.determineAuthorizedDate(transactionData);
		if (determinedAuthorizedDate) {
			transactionData.authorized_date = determinedAuthorizedDate;
		}

		return await TransactionDao.createTransaction(workspace_id, transactionData);
	}

	/**
	 * inPATCHes transactions - inserts or patches ONLY provided values
	 * @param workspace_id 
	 * @param transactionData 
	 * @returns 
	 */
	public static inPatchTransaction = async (workspace_id: string, transactionData: CreateTransaction) => {
		const existingTransaction = await TransactionDao.getMatchingTransaction(workspace_id, transactionData);
		let upsertedTransaction: Transaction | null = null;
		let created = false;
		if (existingTransaction) {
			// Update existing transaction
			upsertedTransaction = await TransactionDao.patchTransaction(workspace_id, existingTransaction.transaction_id, { ...transactionData, transaction_id: existingTransaction.transaction_id } as Transaction);
		} else {
			// Create new transaction
			upsertedTransaction = await this.createTransaction(workspace_id, transactionData);
			created = true;
		}

		// Do transfer pairing operations, ONLY if transfer_pair_id is present
		if (Object.hasOwn(transactionData, 'transfer_pair_id')) {
			if (existingTransaction?.transfer_pair_id && transactionData.transfer_pair_id !== existingTransaction.transfer_pair_id) {
				// If we're not setting a new transfer pair, we need to remove the old one
				await TransactionDao.breakTransferPair(workspace_id, existingTransaction.transfer_pair_id, existingTransaction.transaction_id);
			}
			if (transactionData.transfer_pair_id) {
				await TransactionDao.setTransferPair(workspace_id, upsertedTransaction.transaction_id, transactionData.transfer_pair_id);
				upsertedTransaction = (await TransactionDao.getTransactionById(upsertedTransaction.transaction_id))!;
			}
		}
		return {
			transaction: upsertedTransaction,
			created,
		}
	}

	/**
	 * determines if two pending transactions are the same
	 */
	public static comparePendingTransactions(tx1: CreateTransaction, tx2: CreateTransaction): boolean {
		return tx1.amount === tx2.amount &&
			tx1.original_description === tx2.original_description;
	}

	/**
	 * Match a completed transaction to the most likely finished-pending transaction.
	 */
	public static transactionMatchesOldPending(
		completedTransaction: CreateTransaction,
		pendingTransactions: CreateTransaction
	): boolean {
		return false; // We need better criteria for this
		// return pendingTransactions.find(pendingTransaction =>
		// 	this.comparePendingTransactions(completedTransaction, pendingTransaction)
		// );
	}

	public static async syncNewTransactionsForAccount(workspace_id: string, account_id: string, incomingTransactions: CreateTransaction[]) {
		// First, assign date orders to incoming transactions. When doing so, make sure to preserve any existing date orders.
		// THE TRANSACTIONS MUST BE A COMPLETE SET OF ALL TRANSACTIONS FOR THE DATES INVOLVED
		incomingTransactions = TransactionUtils.assignDateOrders(incomingTransactions);

		const oldPendingTransactions = await TransactionDao.getPendingForAccount(workspace_id, account_id);

		// FIRST UPDATE PENDING TRANSACTIONS!
		const incomingPendingTransactions = incomingTransactions.filter(t => t.pending);
		const noLongerPendingTransactions = oldPendingTransactions.filter(oldTransaction => !incomingPendingTransactions.some(t =>
			TransactionService.comparePendingTransactions(t, oldTransaction)
		));

		// Don't create new pending transactions if they already exist
		// This MAY still include transactions which we have already processed! We'll just upsert them.
		const filteredIncoming = incomingTransactions.filter(t =>
			!oldPendingTransactions.some(oldTransaction =>
				TransactionService.comparePendingTransactions(t, oldTransaction)
			)
		);

		// Update all no-longer-pending transactions
		for (const oldTransaction of noLongerPendingTransactions) {
			TransactionDao.patchTransaction(workspace_id, oldTransaction.transaction_id, {
				pending: true,
				done_pending: true,
			});
		}

		// THEN UPSERT NEW TRANSACTIONS
		const upsertResults = await Promise.all(filteredIncoming.map(async (transaction) => {
			transaction.account_id = account_id;
			// See if this transaction matches any old pending transactions (not any still pending)
			const matchingOldPendingTransaction = noLongerPendingTransactions.find(t =>
				TransactionService.transactionMatchesOldPending(transaction, t)
			);
			if (matchingOldPendingTransaction) {
				// TODO copy attributions from pending
			}

			return await this.inPatchTransaction(workspace_id, transaction);
		}));

		const savedNewTransactions = upsertResults.filter(result => result.created).map(result => result.transaction);

		// Apply rules to all NEW transactions
		await TransactionRuleService.applyRulesToTransactions(workspace_id, savedNewTransactions);

		// Look for merchants for new transactions.
		// NOTE! This expects that savedNewTransactions have been updated with a merchant_id if applicable by the rules.
		const transactionsWithoutMerchants = savedNewTransactions.filter(tx => !tx.merchant_id);
		if (transactionsWithoutMerchants.length > 0) {
			const merchantResults = await MerchantService.searchForTransactionMerchants(transactionsWithoutMerchants);
			await Promise.all(merchantResults.map(async ({ existingMerchant, transactions }) => {
				if (existingMerchant) {
					// Update all transactions with the new merchant
					await Promise.all(transactions.map(tx => {
						tx.merchant_id = existingMerchant.merchant_id;
						return TransactionDao.patchTransaction(workspace_id, tx.transaction_id, tx);
					}));
				}
			}));
		}

		// Request review for new transactions, but NOT PENDING
		const needsReview = savedNewTransactions.filter(result => !result.TransactionReview && !result.pending);
		await Promise.all(needsReview.map(tx => TransactionService.requestTransactionReview(tx)));

		return upsertResults;
	}

	private static determineAuthorizedDate(transaction: CreateTransaction): DelfiDate | null {
		if (transaction.authorized_date) {
			return transaction.authorized_date;
		}

		// Determine authorized date from description if possible
		const patterns = [
			// MM/DD
			() => {
				const dateInDescriptionRegex = /(?<month>\d{2})\/(?<date>\d{2})/g;
				const match = dateInDescriptionRegex.exec(transaction.original_description);
				if (match?.groups) {
					const month = parseInt(match.groups.month!, 10) - 1; // Convert to zero-based month
					const dayOfMonth = parseInt(match.groups.date!, 10);

					const validNumbers = month >= 1 && month <= 12 && dayOfMonth >= 1 && dayOfMonth <= 31;
					if (!validNumbers) {
						return undefined; // Invalid date in description
					}

					// if extracted is december and true is january and extracted date is greater than true date, then we can assume the year is previous
					const isPreviousYear = month === 11 && transaction.date.month() === 0 && dayOfMonth > transaction.date.date();
					const year = isPreviousYear ? transaction.date.year() - 1 : transaction.date.year();
					const extractedDate = ddate(new Date(year, month, dayOfMonth));
					const isInSaneRange = extractedDate.isBetweenInclusive(
						transaction.date.subtract(1, 'week'),
						transaction.date
					)

					if (isInSaneRange) {
						return extractedDate;
					}
				}
			},

			// YYYY-MM-DD
			() => {
				const dateInDescriptionRegex = /(?<year>\d{4})-(?<month>\d{2})-(?<date>\d{2})/g;
				const match = dateInDescriptionRegex.exec(transaction.original_description);
				if (match?.groups) {
					return ddate(match[0]);
				}
			}
		]

		for (const pattern of patterns) {
			const extractedDate = pattern();
			if (extractedDate) {
				transaction.authorized_date = extractedDate;
				return extractedDate;
			}
		}

		return null;
	}

	public static async getTransactionsForAccount(workspace_id: string, account_id: string): Promise<Transaction[]> {
		return await TransactionDao.getTransactionsForAccount(workspace_id, account_id);
	}

	/** Looks up workspace rules for assigning transactions and finds the user to assign the review to */
	private static async requestTransactionReview(transaction: Transaction): Promise<void> {
		// TODO implement workspace rules and settings for transaction reviews. For now create the pending review record without an assignment
		await TransactionReviewDao.createTransactionReview(transaction.workspace_id, transaction.transaction_id);
	}

	public static async markTransactionReviewed(workspace_id, transaction_id: string, user_id?: string) {
		const transaction = await TransactionDao.getTransactionById(transaction_id);
		if (!transaction) {
			throw new Error(`Transaction with ID ${transaction_id} not found`);
		}
		if (transaction.workspace_id !== workspace_id) {
			throw new Error(`Transaction with ID ${transaction_id} does not belong to your workspace`);
		}

		const review = await TransactionReviewDao.markTransactionReviewed(workspace_id, transaction_id, user_id);
		// Because transfer pairs are hidden in the UI, if the user reviews on side of the pair we should review the other as well
		if (transaction.transfer_pair_id) {
			await TransactionReviewDao.markTransactionReviewed(workspace_id, transaction.transfer_pair_id, user_id);
		}
		return review;
	}

	public static async findAndLinkTransferPairs(workspace_id: string, transactions: Transaction[]) {
		// Find potential transfer pairs
		const pendingPairs = transactions.filter(t => t.transfer_pair_id === null && !t.pending);
		for (const transaction of pendingPairs) {
			console.log("Finding transfer pair for transaction", transaction.original_description, transaction.amount);
			const potentialPairs = await TransactionDao.findPotentialTransferPairs(workspace_id, transaction);
			console.log(`Found ${potentialPairs.length} potential pairs`);
			if (potentialPairs.length === 1) {
				await TransactionDao.setTransferPair(workspace_id, transaction.transaction_id, potentialPairs[0].transaction_id);
			}
		}
	}
};
