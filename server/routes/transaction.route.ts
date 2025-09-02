import { TransactionDao } from "server/data/TransactionDao";
import { TransactionService } from "server/services/TransactionService";

export default (app, _, done) => {
    app.get('/range', async function handler (request, reply) {
		const workspace_id = request.sessionUser.workspace_id;
		const { startDate, endDate } = request.query;
        const data = await TransactionDao.getTransactionsInRange(workspace_id, startDate as string, endDate as string);
        return {
            success: true,
            data,
        };
    });

	app.post('/:transaction_id', async function handler (request, reply) {
		const workspace_id = request.sessionUser.workspace_id;
		const updateData = request.body;
		const data = await TransactionService.inPatchTransaction(workspace_id, updateData);
		return {
			success: true,
			data,
		};
	});

	app.post('/:transaction_id/review', async function handler (request, reply) {
		const workspace_id = request.sessionUser.workspace_id;
		const user_id = request.sessionUser.user_id;
		const { transaction_id } = request.params;
		const data = await TransactionService.markTransactionReviewed(workspace_id, transaction_id, user_id);
		return {
			success: true,
			data,
		};
	});

    done();
};
