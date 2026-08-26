import { prisma } from "../../prisma/client";
import { categoriesArray, flatCategoriesMap, defaultKeyToSystemCategoryMap, type CategoryKey } from "delfi-core/models/systemCategories";
import { WorkspaceDao } from "./WorkspaceDao";

export const CategoryDao = {
	hasInit: false,
	
	async getWorkspaceCategories(workspace_id: string) {
		return (await prisma.category.findMany({
			where: {
				workspace_id,
				parent_category_id: null, // Only fetch parent categories
			},
			include: {
				Children: true,
			},
		})).sort((a, b) => (a.name).localeCompare(b.name)).map(category => {
			return {
				...category,
				Children: category.Children.sort((a, b) => (a.name).localeCompare(b.name)),
			};
		});
	},

	async getWorkspaceDetectionMappings(workspace_id: string) {
		return await prisma.categoryDetectionMapping.findMany({
			where: {
				workspace_id,
			},
		});
	},

	async getCategoryById(category_id: string) {
		return await prisma.category.findUnique({
			where: {
				category_id,
			},
			include: {
				ParentCategory: true
			}
		});
	},

	async getWorkspaceCategoryMappingByDetectionKey(workspace_id: string, detection_key?: CategoryKey) {
		if (!detection_key) return null;

		return await prisma.categoryDetectionMapping.findUnique({
			where: {
				workspace_id_detection_key: {
					workspace_id,
					detection_key: detection_key,
				},
			},
			include: {
				Category: true, // Include the category details
			},
		});
	},
};
