import { instantiateDates, type DelfiDate } from 'delfi-core/utils/dateUtils';
import request from './request';
import type { CreateTransaction, Transaction } from 'delfi-core/models/Transaction';

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
	}
};
