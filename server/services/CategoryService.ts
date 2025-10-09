import { categoriesArray, type CategoryKey } from "delfi-core/models/systemCategories";
import { prisma } from "../../prisma/client";
import type { Category } from "delfi-core/models/Category";
import { CategoryDao } from "server/data/CategoryDao";
import { MerchantDao } from "server/data/MerchantDao";


export const CategoryService = {
	async getMerchantCategory(workspace_id: string, merchant_id: string) {
		const merchant = await MerchantDao.getMerchantById(merchant_id);

		if (!merchant) {
			throw new Error(`Merchant with ID ${merchant_id} not found`);
		}

		const categoryAssociation = merchant.detection_key;
		if (!categoryAssociation) {
			return null;
		}
		return await CategoryDao.getWorkspaceCategoryMappingByDetectionKey(workspace_id, categoryAssociation as CategoryKey);
	},

    async createWorkspaceCategory(categoryData: Omit<Category, 'category_id'>) {
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

    async updateCategory(workspace_id: string, category_id: string, categoryData: Partial<Category>) {
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