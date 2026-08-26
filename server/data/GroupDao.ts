import type { BudgetGroup } from "delfi-core/models/Transaction";
import { prisma } from "../../prisma/client";

export const BudgetGroupDao = {
	hasInit: false,
	

	async createGroup(workspace_id, data) {
		return await prisma.budgetGroup.create({
			data: {
				...data,
				workspace_id
			}
		});
	},

	async getAllGroups(workspace_id?: string) {
		return await prisma.budgetGroup.findMany({
			where: {
				workspace_id: workspace_id,
			},
		});
	},

	async getGroupById(groupId: string) {
		return await prisma.budgetGroup.findUnique({
			where: {
				group_id: groupId,
			},
		});
	},

	async updateGroup(groupId: string, data: Partial<BudgetGroup>) {
		return await prisma.budgetGroup.update({
			where: {
				group_id: groupId,
			},
			data,
		});
	},

	async deleteGroup(groupId: string) {
		await prisma.budgetGroup.delete({
			where: {
				group_id: groupId,
			},
		});
	},
};