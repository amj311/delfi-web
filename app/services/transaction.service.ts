import { instantiateDates, type DelfiDate } from 'delfi-core/utils/dateUtils';
import request from './request';
import type { CreateTransaction, Transaction } from 'delfi-core/models/Transaction';

type AttributionUpdates = Partial<{
	budget_id: string | null;
	budget_child_item_id: string | null;
	category_id: string | null;
	group_id: string | null;
}>;

export const TransactionService = {
	/**
	 * Get transactions for a specific account
	 * @param accountId The account ID to get transactions for
	 * @returns Promise with the transactions data
	 */
	async getAccountTransactions(accountId: string) {
		try {
			const response = await request.get(`/account/${accountId}/transactions`);
			return response.data;
		} catch (error) {
			console.error('Error fetching account transactions:', error);
			throw error;
		}
	},

	async getTransactionsInRange(startDate: DelfiDate, endDate: DelfiDate) {
		const { data } = await request.get(`/transactions/range`, {
			params: {
				startDate: startDate.toString(),
				endDate: endDate.toString(),
			},
		});
		return instantiateDates(data.data) as Transaction[];
	},

	async updateTransaction(transactionId: string, updates: CreateTransaction) {
		try {
			const response = await request.post(`/transactions/${transactionId}`, updates);
			return response.data;
		} catch (error) {
			console.error('Error updating transaction:', error);
			throw error;
		}
	},

	async markTransactionReviewed(transactionId: string) {
		try {
			const response = await request.post(`/transactions/${transactionId}/review`);
			return response.data;
		} catch (error) {
			console.error('Error marking transaction as reviewed:', error);
			throw error;
		}
	},

	async getApplicableRules(transactionId: string) {
		try {
			const response = await request.get(`/transaction-rule/applicable/${transactionId}`);
			return response.data.data;
		} catch (error) {
			console.error('Error fetching applicable rules:', error);
			throw error;
		}
	},

	async bulkUpdateAttributions(attributionIds: string[], updates: AttributionUpdates) {
		const { data } = await request.post(`/transactions/bulk-patch-attributions`, {
			attributionIds,
			updates,
		});
		return instantiateDates(data.data) as Transaction[];
	},
};
