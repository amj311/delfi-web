import type { BudgetGroup } from "delfi-core/models/Transaction";
import { prisma } from "../../prisma/client";
import { TestDataService } from "server/services/TestDataService";

export const BudgetGroupDao = {
	async setupTestData() {
		for (const group of await TestDataService.budgetGroups) {
			const exists = Boolean(await BudgetGroupDao.getGroupById(group.group_id));
			if (exists) {
				await BudgetGroupDao.updateGroup(group.group_id, group);
			} else {
				await BudgetGroupDao.createGroup(group);
			}
		}
	},


	async createGroup(data) {
		return await prisma.budgetGroup.create({
			data: {
				...data
			}
		});
	},

	async getAllGroups(workspace_id?: string) {
		await BudgetGroupDao.setupTestData(); // Ensure test data is set up before fetching groups
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