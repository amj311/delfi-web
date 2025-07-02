import type { CreateTransaction, Transaction } from "delfi-core/models/Transaction";
import { date, type DelfiDate } from "delfi-core/utils/dateUtils";
import { TransactionDao } from "server/data/TransactionDao";

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

	public static upsertTransaction = async (workspace_id: string, transactionData: CreateTransaction) => {
		const existingTransaction = await TransactionDao.getMatchingTransaction(workspace_id, transactionData);
		if (existingTransaction) {
			// Update existing transaction
			return await TransactionDao.updateTransaction(workspace_id, existingTransaction.transaction_id, transactionData);
		} else {
			// Create new transaction
			return await this.createTransaction(workspace_id, transactionData);
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
		const oldPendingTransactions = await TransactionDao.getPendingForAccount(workspace_id, account_id);

		// FIRST UPDATE PENDING TRANSACTIONS!
		const incomingPendingTransactions = incomingTransactions.filter(t => t.pending);
		const noLongerPendingTransactions = oldPendingTransactions.filter(oldTransaction => !incomingPendingTransactions.some(t =>
			TransactionService.comparePendingTransactions(t, oldTransaction)
		));

		// Don't create new pending transactions if they already exist
		const newTransactions = incomingTransactions.filter(t =>
			!oldPendingTransactions.some(oldTransaction =>
				TransactionService.comparePendingTransactions(t, oldTransaction)
			)
		);

		// Update all no-longer-pending transactions
		for (const oldTransaction of noLongerPendingTransactions) {
			TransactionDao.updateTransaction(workspace_id, oldTransaction.transaction_id, {
				pending: true,
				done_pending: true,
			});
		}

		// THEN UPSERT NEW TRANSACTIONS
		const results: Transaction[] = [];
		for (const transaction of newTransactions) {
			transaction.account_id = account_id;

			// Only look through no-longer-pending transactions for matches
			const matchingOldPendingTransaction = noLongerPendingTransactions.find(t =>
				TransactionService.transactionMatchesOldPending(transaction, t)
			);
			if (matchingOldPendingTransaction) {
				// TODO copy attributions from pending
			}
			results.push(await this.upsertTransaction(workspace_id, transaction));
		}
		return results;
	}

	private static determineAuthorizedDate(transaction: CreateTransaction): DelfiDate | undefined {
		if (transaction.authorized_date) {
			return transaction.authorized_date;
		}

		// Determine authorized date from description if possible
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
			const extractedDate = date(new Date(year, month, dayOfMonth));
			const isInSaneRange = extractedDate.isBetweenInclusive(
				transaction.date.subtract(1, 'week'),
				transaction.date
			)

			if (isInSaneRange) {
				transaction.authorized_date = extractedDate;
			}
		}
	}

	public static async getTransactionsForAccount(workspace_id: string, account_id: string): Promise<Transaction[]> {
		return await TransactionDao.getTransactionsForAccount(workspace_id, account_id);
	}
};
