import type { CreateTransaction, Transaction } from "delfi-core/models/Transaction";
import { date, type DelfiDate } from "delfi-core/utils/dateUtils";
import { TransactionDao } from "server/data/TransactionDao";

export class TransactionService {
	private static async createTransaction(user_id: string, transactionData: CreateTransaction) {
		// New transaction MUST have attributions totalling the whole amount
		if (!transactionData.Attributions || transactionData.Attributions.length === 0) {
			transactionData.Attributions = [{
				amount: transactionData.amount
			}];
		}
		const attributionTotal = transactionData.Attributions.reduce((sum, attr) => sum + attr.amount, 0);
		if (attributionTotal !== transactionData.amount) {
			throw new Error("Attributions must total the transaction amount");
		}

		const determinedAuthorizedDate = this.determineAuthorizedDate(transactionData);
		if (determinedAuthorizedDate) {
			transactionData.authorized_date = determinedAuthorizedDate;
		}

		return await TransactionDao.createTransaction(user_id, transactionData);
    }

	public static upsertTransaction = async (user_id: string, transactionData: CreateTransaction) => {
		const existingTransaction = await TransactionDao.getMatchingTransaction(user_id, transactionData);
		if (existingTransaction) {
			// Update existing transaction
			return await TransactionDao.updateTransaction(user_id, existingTransaction.transaction_id, transactionData);
		} else {
			// Create new transaction
			return await this.createTransaction(user_id, transactionData);
		}
	}

	public static async syncNewTransactionsForAccount(user_id: string, account_id: string, transactions: CreateTransaction[]) {
		const oldPendingTransactions = await TransactionDao.getPendingForAccount(user_id, account_id);

		// FIRST UPDATE PENDING TRANSACTIONS!
		const newPendingTransactions = transactions.filter(t => t.pending);
		const noLongerPendingTransactions = oldPendingTransactions.filter(oldTransaction => !newPendingTransactions.some(t => 
				t.amount === oldTransaction.amount &&
				t.date === oldTransaction.date &&
				t.original_description === oldTransaction.original_description // match same description for still-pending
		));

		// THEN UPSERT NEW TRANSACTIONS
		const results: Transaction[] = [];
		for (const transaction of transactions) {
			transaction.target_account_id = account_id;

			// Only look through no-longer-pending transactions for matches
			const matchingOldPendingTransaction = noLongerPendingTransactions.find(t =>
				t.amount === transaction.amount &&
				t.date === transaction.date
				// descriptions may change when no longer pending
			);
			if (matchingOldPendingTransaction) {
				// Reuse the old transaction, remove it from the noLongerPendingTransactions list so it doesn't get deleted
				noLongerPendingTransactions.splice(noLongerPendingTransactions.indexOf(matchingOldPendingTransaction), 1);
				results.push(await TransactionDao.updateTransaction(user_id, matchingOldPendingTransaction.transaction_id, {
					pending: false,
					original_description: transaction.original_description,
				}));
			}
			else {
				results.push(await this.upsertTransaction(user_id, transaction));
			}
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
};
