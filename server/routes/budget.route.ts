import type { Budget } from "delfi-core/models/Budget";
import { BudgetDao } from "../data/BudgetDao";

export default (fastify, _, done) => {

    fastify.post('/', async function handler (request, reply) {
        const budgetData = request.body as Budget;
        const workspace_id = request.sessionUser.workspace_id;
        const data = await BudgetDao.createBudget(workspace_id, budgetData);
        return {
            success: true,
            data,
        };
    });

    fastify.get('/', async function handler (request, reply) {
        const workspace_id = request.sessionUser.workspace_id;
        const data = await BudgetDao.getAllBudgets(workspace_id);
        return {
            success: true,
            data,
        };
    });

    fastify.get('/:id', async function handler (request, reply) {
        const budgetId = request.params.id;
        const workspace_id = request.sessionUser.workspace_id;
        const data = await BudgetDao.getBudgetById(workspace_id, budgetId);
        return {
            success: true,
            data,
        };
    });

    fastify.put('/:id', async function handler (request, reply) {
        const budgetId = request.params.id;
        const budgetData = request.body as Budget;
        const workspace_id = request.sessionUser.workspace_id;
        const data = await BudgetDao.updateBudget(workspace_id, budgetId, budgetData);
        return {
            success: true,
            data,
        };
    });

    fastify.delete('/:id', async function handler (request, reply) {
        const budgetId = request.params.id;
        const workspace_id = request.sessionUser.workspace_id;
        await BudgetDao.deleteBudget(workspace_id, budgetId);
        return {
            success: true,
        };
    });

    done();
};