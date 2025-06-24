import { categoriesArray } from "delfi-core/models/systemCategories";
import { prisma } from "../../prisma/client";
import type { CategoryDetails } from "delfi-core/models/Category";
import { CategoryDao } from "server/data/CategoryDao";


export const CategoryService = {
    async createWorkspaceCategory(categoryData: Omit<CategoryDetails, 'category_id'>) {
        // return await prisma.category.create({
        //     data: categoryData,
        // });
    },

    async getWorkspaceCategories(workspace_id: string) {
        // return await prisma.workspaceDefinedCategory.findMany({
		// 	where: {
		// 		workspace_id,
		// 	},
		// });
		return await CategoryDao.getWorkspaceCategories(workspace_id);
    },

    async getCategoryById(workspace_id: string, category_id: string) {
        // return await prisma.workspaceDefinedCategory.findUnique({
        //     where: {
        //         category_id,
		// 		workspace_id,
        //     },
        // });
    },

    async updateCategory(workspace_id: string, category_id: string, categoryData: Partial<CategoryDetails>) {
        // return await prisma.workspaceDefinedCategory.update({
        //     where: {
        //         category_id,
		// 		workspace_id,
        //     },
        //     data: categoryData,
        // });
    },

    async deleteCategory(workspace_id, category_id: string) {
        // await prisma.workspaceDefinedCategory.delete({
        //     where: {
        //         category_id,
		// 		workspace_id,
        //     },
        // });
    },
};