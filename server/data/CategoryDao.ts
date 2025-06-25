import { prisma } from "../../prisma/client";
import { categoriesArray, categoryGroups, flatCategoriesMap, plaidCategoryToSystemCategoryMap } from "delfi-core/models/systemCategories";
import { WorkspaceDao } from "./WorkspaceDao";

export const CategoryDao = {
	async setupTestData() {
		// setup default categories for the test workspace
		const workspaces = await WorkspaceDao.getAllWorkspaces();

		const workspace_id = workspaces[0]!.workspace_id;

		for (const group of categoryGroups) {
			await prisma.categoryGroup.upsert({
				where: { group_id: group.group_id, workspace_id: workspace_id },
				update: {
					group_id: group.group_id,
					name: group.name,
					workspace_id: workspace_id,
					icon: group.icon,
					color: group.color,
				},
				create: {
					group_id: group.group_id,
					name: group.name,
					workspace_id: workspace_id,
					icon: group.icon,
					color: group.color,
				},
			});
		}

		for (const category of categoriesArray) {
			await prisma.category.upsert({
				where: { category_id: category.category_id, workspace_id: workspace_id },
				update: {
					category_id: category.category_id,
					name: category.name,
					icon: category.icon,
					workspace_id: workspace_id,
					group_id: category.group_id,
					type: category.type,
				},
				create: {
					category_id: category.category_id,
					name: category.name,
					icon: category.icon,
					workspace_id: workspace_id,
					group_id: category.group_id,
					type: category.type,
				},
			});
		}

		for (const [detection_key, system_category_name] of Object.entries(plaidCategoryToSystemCategoryMap)) {
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
			},
			include: {
				Group: true,
			},
		})).sort((a, b) => (a.Group.name + "__" + a.name).localeCompare(b.Group.name + "__" + b.name));
	},

	async getWorkspaceDetectionMappings(workspace_id: string) {
		await this.setupTestData(); // Ensure test data is set up before fetching mappings
		return await prisma.categoryDetectionMapping.findMany({
			where: {
				workspace_id,
			},
		});
	}
};
