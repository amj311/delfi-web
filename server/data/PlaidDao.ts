import type { PlaidItem } from "server/services/PlaidService";
import { prisma } from "../../prisma/client";

export const PlaidDao = {
    async createItem(item: PlaidItem) {
		return await prisma.plaidItem.create({
            data: {
				plaid_item_id: item.plaid_item_id,
				access_token: item.access_token,
				plaid_institution_id: item.plaid_institution_id,

				Workspace: {
					connect: {
						workspace_id: item.workspace_id,
					},
				},
            },
        });
    },

	async getWorkspaceItems(workspace_id: string) {
		return await prisma.plaidItem.findMany({
			where: {
				workspace_id,
			},
			include: {
				accounts: true,
			},
		});
	},

	async getItemById(item_id: string) {
		return await prisma.plaidItem.findUnique({
			where: {
				plaid_item_id: item_id,
			},
			include: {
				accounts: true,
			},
		});
	},
};
