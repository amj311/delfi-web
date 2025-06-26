import { TransactionDao } from "server/data/TransactionDao";

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

    done();
};
