import request from './request';

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
};
