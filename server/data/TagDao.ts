import type { Tag } from "delfi-core/models/Transaction";
import { prisma } from "../../prisma/client";
import { TestDataService } from "server/services/TestDataService";

export const TagService = {
	async createTag(data: Omit<Tag, 'tag_id'>) {
		return await prisma.tag.create({
			data,
		});
	},

	async getAllTags(workspace_id?: string) {
		// return await prisma.tag.findMany({
		// 	where: {
		// 		workspace_id: workspace_id,
		// 	},
		// });
		return TestDataService.tags;
	},

	async getTagById(tagId: string) {
		return await prisma.tag.findUnique({
			where: {
				tag_id: tagId,
			},
		});
	},

	async updateTag(tagId: string, data: Partial<Tag>) {
		return await prisma.tag.update({
			where: {
				tag_id: tagId,
			},
			data,
		});
	},

	async deleteTag(tagId: string) {
		await prisma.tag.delete({
			where: {
				tag_id: tagId,
			},
		});
	},
};