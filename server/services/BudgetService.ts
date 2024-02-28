import { Budget, BudgetDbInput } from "../../models/types";
import { prisma } from "../../prisma/client";
import { my_budgets } from "./myData";

export const BudgetService = {
    async createBudget(user_id: string, budgetData: Omit<BudgetDbInput, 'budget_id' | 'user_id'>) {
		return await prisma.budget.create({
            data: {
				name: budgetData.name,
				description: budgetData.description,
				schedule: budgetData.schedule,
				amount: budgetData.amount,
				num_months: budgetData.num_months,
				category_id: budgetData.category_id,
				User: {
					connect: {
						user_id,
					},
				},
				SystemEventAccount: {
					connect: {
						account_id: budgetData.system_event_account_id,
					},
				},
            } as any,
        });
    },

    async getAllBudgets(user_id: string): Promise<Budget[]>  {
        const budgets = await prisma.budget.findMany({
            where: {
                user_id,
            },
        });
		return budgets.concat(Object.values(my_budgets) as any) as any;
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
