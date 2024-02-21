import { Budget } from "@prisma/client";
import { BudgetService } from "../services/BudgetService";

export default (fastify, _, done) => {
    fastify.post('/', async function handler (request, reply) {
        const budgetData = request.body as Budget;
        const user_id = request.sessionUser.user_id;
        const data = await BudgetService.createBudget(user_id, budgetData);
        return {
            success: true,
            data,
        };
    });

    fastify.get('/', async function handler (request, reply) {
        const user_id = request.sessionUser.user_id;
        const data = await BudgetService.getAllBudgets(user_id);
        return {
            success: true,
            data,
        };
    });

    fastify.get('/:id', async function handler (request, reply) {
        const budgetId = request.params.id;
        const user_id = request.sessionUser.user_id;
        const data = await BudgetService.getBudgetById(user_id, budgetId);
        return {
            success: true,
            data,
        };
    });

    fastify.put('/:id', async function handler (request, reply) {
        const budgetId = request.params.id;
        const budgetData = request.body as Budget;
        const user_id = request.sessionUser.user_id;
        const data = await BudgetService.updateBudget(user_id, budgetId, budgetData);
        return {
            success: true,
            data,
        };
    });

    fastify.delete('/:id', async function handler (request, reply) {
        const budgetId = request.params.id;
        const user_id = request.sessionUser.user_id;
        await BudgetService.deleteBudget(user_id, budgetId);
        return {
            success: true,
        };
    });

    done();
};