import { PlannedTransaction } from "@prisma/client";
import { PlannedTransactionService } from "../services/plannedTransactionService";

export default (fastify, _, done) => {

    fastify.post('/', async function handler (request, reply) {
        const plannedTransactionData = request.body as PlannedTransaction;
        const user_id = request.sessionUser.user_id;
        const data = await PlannedTransactionService.createPlannedTransaction(user_id, plannedTransactionData);
        return {
            success: true,
            data,
        };
    });

    fastify.get('/', async function handler (request, reply) {
        const user_id = request.sessionUser.user_id;
        const data = await PlannedTransactionService.getAllPlannedTransactions(user_id);
        return {
            success: true,
            data,
        };
    });

    fastify.get('/:id', async function handler (request, reply) {
        const plannedTransactionId = request.params.id;
        const user_id = request.sessionUser.user_id;
        const data = await PlannedTransactionService.getPlannedTransactionById(user_id, plannedTransactionId);
        return {
            success: true,
            data,
        };
    });

    fastify.put('/:id', async function handler (request, reply) {
        const plannedTransactionId = request.params.id;
        const plannedTransactionData = request.body as PlannedTransaction;
        const user_id = request.sessionUser.user_id;
        const data = await PlannedTransactionService.updatePlannedTransaction(user_id, plannedTransactionId, plannedTransactionData);
        return {
            success: true,
            data,
        };
    });

    fastify.delete('/:id', async function handler (request, reply) {
        const plannedTransactionId = request.params.id;
        const user_id = request.sessionUser.user_id;
        await PlannedTransactionService.deletePlannedTransaction(user_id, plannedTransactionId);
        return {
            success: true,
        };
    });

    done();
};