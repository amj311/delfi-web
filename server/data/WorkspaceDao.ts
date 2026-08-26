import type { Workspace } from "server/services/WorkspaceService";
import { prisma } from "../../prisma/client";

export const WorkspaceDao = {

	async getAllWorkspaces(): Promise<Workspace[]> {
		return await prisma.workspace.findMany();
	},

    async getUserWorkspaces(user_id: string): Promise<Workspace[]>  {
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
