import { Budget, BudgetDbInput } from "../../models/types";
import { prisma } from "../../prisma/client";
import { my_budgets } from "./myData";

export const BudgetService = {
    async createBudget(user_id: string, budgetData: Omit<BudgetDbInput, 'budget_id'>) {
        return await prisma.budget.create({
            data: {
                ...budgetData,
                user_id,
            },
        });
    },

    async getAllBudgets(user_id: string): Promise<Budget[]>  {
        const budgets = await prisma.budget.findMany({
            where: {
                user_id,
            },
        });
		// return budgets.map(a => ({
		// 	...a,
		// 	partitions: a.partitions.map(p => ({
		// 		...p,
		// 		schedule_details: p.schedule_details as object,
		// 	}))
		// }))
		return Object.values(my_budgets);
    },

    async getBudgetById(user_id: string, budgetId: string) {
        return await prisma.budget.findUnique({
            where: {
                budget_id: budgetId,
                user_id,
            },
        });
    },

    async updateBudget(user_id: string, budgetId: string, budgetData: Partial<BudgetDbInput>) {
        return await prisma.budget.update({
            where: {
                budget_id: budgetId,
                user_id,
            },
            data: budgetData,
        });
    },

    async deleteBudget(user_id: string, budgetId: string) {
        await prisma.budget.delete({
            where: {
                budget_id: budgetId,
                user_id,
            },
        });
    },
};
