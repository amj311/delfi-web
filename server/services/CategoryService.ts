import { prisma } from "../../prisma/client";
import { UserCategory } from "../../models/types";
import { nestedCategories } from "../../delfi-core/models/systemCategories";


export const CategoryService = {
    async createUserCategory(categoryData: Omit<UserCategory, 'category_id'>) {
        return await prisma.userDefinedCategory.create({
            data: categoryData,
        });
    },

    async getUserCategories(user_id: string) {
        // return await prisma.userDefinedCategory.findMany({
		// 	where: {
		// 		user_id,
		// 	},
		// });
		return nestedCategories;
    },

    async getCategoryById(user_id: string, category_id: string) {
        return await prisma.userDefinedCategory.findUnique({
            where: {
                category_id,
				user_id,
            },
        });
    },

    async updateCategory(user_id: string, category_id: string, categoryData: Partial<UserCategory>) {
        return await prisma.userDefinedCategory.update({
            where: {
                category_id,
				user_id,
            },
            data: categoryData,
        });
    },

    async deleteCategory(user_id, category_id: string) {
        await prisma.userDefinedCategory.delete({
            where: {
                category_id,
				user_id,
            },
        });
    },
};