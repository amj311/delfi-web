import { prisma } from "../../prisma/client";
import { categoriesArray, flatCategoriesMap, defaultKeyToSystemCategoryMap } from "delfi-core/models/systemCategories";
import { WorkspaceDao } from "./WorkspaceDao";

export const CategoryDao = {
	async setupTestData() {
		// setup default categories for the test workspace
		const workspaces = await WorkspaceDao.getAllWorkspaces();
		const workspace_id = workspaces[0]!.workspace_id;

		for (const category of categoriesArray) {
			await prisma.category.upsert({
				where: { category_id: category.category_id, workspace_id: workspace_id },
				update: {
					category_id: category.category_id,
					name: category.name,
					icon: category.icon,
					color: category.color,
					workspace_id: workspace_id,
					parent_category_id: category.parent_category_id,
					type: category.type,
				},
				create: {
					category_id: category.category_id,
					name: category.name,
					icon: category.icon,
					color: category.color,
					workspace_id: workspace_id,
					parent_category_id: category.parent_category_id,
					type: category.type,
				},
			});
		}

		for (const [detection_key, system_category_name] of Object.entries(defaultKeyToSystemCategoryMap)) {
			await prisma.categoryDetectionMapping.upsert({
				where: { workspace_id_detection_key: { workspace_id, detection_key } },
				update: {
					detection_key: detection_key,
					category_id: flatCategoriesMap[system_category_name].category_id,
					workspace_id,
				},
				create: {
					detection_key: detection_key,
					category_id: flatCategoriesMap[system_category_name].category_id,
					workspace_id,
				},
			});
		}
	},

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
		await this.setupTestData(); // Ensure test data is set up before fetching mappings
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
	}
};
