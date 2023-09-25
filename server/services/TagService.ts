import { Tag } from "@prisma/client";
import { prisma } from "../../prisma/client";

export const TagService = {
	async createTag(data: Omit<Tag, 'tag_id'>) {
		return await prisma.tag.create({
			data,
		});
	},

	async getAllTags() {
		return await prisma.tag.findMany();
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