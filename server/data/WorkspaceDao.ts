import type { Workspace } from "server/services/WorkspaceService";
import { prisma } from "../../prisma/client";
import { TestDataService } from "server/services/TestDataService";

export const WorkspaceDao = {

	async insertTestWorkspaces(): Promise<void> {
		for (const workspace of TestDataService.workspaces) {
			const existingWorkspace = await prisma.workspace.findUnique({
				where: { workspace_id: workspace.workspace_id },
			});
			if (existingWorkspace) {
				console.log(`Workspace with ID ${workspace.workspace_id} already exists, skipping.`);
				continue;
			}
			await prisma.workspace.create({
				data: {
					workspace_id: workspace.workspace_id,
					name: workspace.name,
					// Add any other necessary fields here
					Users: {
						connect: (await prisma.user.findMany()).map(user => ({ user_id: user.user_id }))
					}
				},
			});
		}
	},

	async getAllWorkspaces(): Promise<Workspace[]> {
		await this.insertTestWorkspaces(); // Ensure test workspaces are inserted
		return await prisma.workspace.findMany();
	},

    async getUserWorkspaces(user_id: string): Promise<Workspace[]>  {
		await this.insertTestWorkspaces(); // Ensure test workspaces are inserted
        const workspaces: any[] = await prisma.workspace.findMany({
			where: {
				Users: {
					some: {
						user_id,
					}
				}
			}
        });
		return workspaces;
    },
};
