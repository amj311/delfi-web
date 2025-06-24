import type { Group } from "delfi-core/models/Transaction";
import { prisma } from "../../prisma/client";
import { TestDataService } from "server/services/TestDataService";

export const GroupDao = {
	async createGroup(data: Omit<Group, 'group_id'>) {
		return await prisma.group.create({
			data,
		});
	},

	async getAllGroups(workspace_id?: string) {
		// return await prisma.group.findMany({
		// 	where: {
		// 		workspace_id: workspace_id,
		// 	},
		// });
		return TestDataService.groups;
	},

	async getGroupById(groupId: string) {
		return await prisma.group.findUnique({
			where: {
				group_id: groupId,
			},
		});
	},

	async updateGroup(groupId: string, data: Partial<Group>) {
		return await prisma.group.update({
			where: {
				group_id: groupId,
			},
			data,
		});
	},

	async deleteGroup(groupId: string) {
		await prisma.group.delete({
			where: {
				group_id: groupId,
			},
		});
	},
};