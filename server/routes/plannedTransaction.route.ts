import type { Budget } from "delfi-core/models/Budget";
import { PlannedTransactionService } from "../services/PlannedTransactionService";

export default (fastify, _, done) => {

    fastify.post('/', async function handler (request, reply) {
        const plannedTransactionData = request.body as Budget;
        const workspace_id = request.sessionUser.workspace_id;
        const data = await PlannedTransactionService.createPlannedTransaction(workspace_id, plannedTransactionData);
        return {
            success: true,
            data,
        };
    });

    fastify.get('/', async function handler (request, reply) {
        const workspace_id = request.sessionUser.workspace_id;
        const data = await PlannedTransactionService.getAllPlannedTransactions(workspace_id);
        return {
            success: true,
            data,
        };
    });

    fastify.get('/:id', async function handler (request, reply) {
        const plannedTransactionId = request.params.id;
        const workspace_id = request.sessionUser.workspace_id;
        const data = await PlannedTransactionService.getPlannedTransactionById(workspace_id, plannedTransactionId);
        return {
            success: true,
            data,
        };
    });

    fastify.put('/:id', async function handler (request, reply) {
        const plannedTransactionId = request.params.id;
        const plannedTransactionData = request.body as Budget;
        const workspace_id = request.sessionUser.workspace_id;
        const data = await PlannedTransactionService.updatePlannedTransaction(workspace_id, plannedTransactionId, plannedTransactionData);
        return {
            success: true,
            data,
        };
    });

    fastify.delete('/:id', async function handler (request, reply) {
        const plannedTransactionId = request.params.id;
        const workspace_id = request.sessionUser.workspace_id;
        await PlannedTransactionService.deletePlannedTransaction(workspace_id, plannedTransactionId);
        return {
            success: true,
        };
    });

    done();
};