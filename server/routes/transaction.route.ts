// import { useTransaction } from "../../prisma/client";
import { instantiateDates } from "delfi-core/utils/dateUtils";
import { prisma, useTransaction } from "../../prisma/client";
import { TransactionDao } from "server/data/TransactionDao";
import { TransactionService } from "server/services/TransactionService";

export default (app, _, done) => {
    app.get('/range', async function handler (request) {
		const workspace_id = request.sessionUser.workspace_id;
		const { startDate, endDate } = request.query;
        const data = await TransactionDao.getTransactionsInRange(workspace_id, startDate as string, endDate as string);
        return {
            success: true,
            data,
        };
    });

	app.post('/bulk-patch-attributions', async function handler (request) {
		const workspace_id = request.sessionUser.workspace_id;
		const { attributionIds, updates } = request.body;
		const data = await TransactionService.bulkPatchTransactionAttributions(workspace_id, attributionIds, updates);
		return {
			success: true,
			data,
		};
	});

	app.post('/:transaction_id', async function handler (request) {
		const workspace_id = request.sessionUser.workspace_id;
		const updateData = request.body;
		const data = await TransactionService.inPatchTransaction(workspace_id, updateData);
		return {
			success: true,
			data,
		};
	});

	app.delete('/:transaction_id', async function handler (request) {
		const workspace_id = request.sessionUser.workspace_id;
		const { transaction_id } = request.params;
		await TransactionDao.deleteTransaction(workspace_id, transaction_id);
		return {
			success: true,
		};
	});

	app.post('/:transaction_id/review', async function handler (request) {
		const workspace_id = request.sessionUser.workspace_id;
		const user_id = request.sessionUser.user_id;
		const { transaction_id } = request.params;
		const data = await TransactionService.markTransactionReviewed(workspace_id, transaction_id, user_id);
		return {
			success: true,
			data,
		};
	});

	app.post('/import/csv', async function handler (request) {
		const workspace_id = request.sessionUser.workspace_id;
		const { transactions, account_id } = request.body;

		const results = await TransactionService.ingestNewTransactionsForAccount(workspace_id, account_id, instantiateDates(transactions), false);

		return {
			success: true,
			data: results,
		}
	})

    done();
};