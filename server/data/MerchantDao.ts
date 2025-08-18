import type { Merchant } from "delfi-core/models/Transaction";
import { prisma } from "../../prisma/client";

export const MerchantDao = {
    async createMerchant(workspace_id: string, merchantData: Merchant) {
        return await prisma.merchant.create({
            data: {
                ...merchantData,
            },
        });
    },

	// TODO: implement workspace-only merchants for multiple workspaces
    async getAllMerchants(workspace_id: string): Promise<Merchant[]>  {
        const merchants: any[] = await prisma.merchant.findMany({
			orderBy: {
				name: 'asc',
			},
		});
		return merchants;
    },

    async getMerchantById(merchantId: string) {
        return await prisma.merchant.findUnique({
            where: {
                merchant_id: merchantId,
            },
        });
    },

	async getMerchantCategory(workspace_id: string, merchant_id: string) {
		const merchant = await prisma.merchant.findUnique({
			where: {
				merchant_id, // could be either global or workspace
			},
		});

		if (!merchant) {
			throw new Error(`Merchant with ID ${merchant_id} not found`);
		}

		const categoryAssociation = merchant.category_association;
		return await prisma.categoryDetectionMapping.findUnique({
			where: {
				workspace_id_detection_key: {
					workspace_id,
					detection_key: categoryAssociation || '',
				},
			},
			include: {
				Category: true, // Include the category details
			},
		});
	},

    async updateMerchant(merchantId: string, merchantData: Merchant) {
		return await prisma.merchant.update({
            where: {
                merchant_id: merchantId,
            },
            data: merchantData,
        });
    },

	async upsertMerchant(unique: Partial<Merchant>, merchantData: Omit<Merchant, 'merchant_id'>) {
		const existingMerchant = await prisma.merchant.findFirst({
			where: {
				...unique,
			},
		});
		if (existingMerchant) {
			return await prisma.merchant.update({
				where: {
					merchant_id: existingMerchant.merchant_id,
				},
				data: {
					logo: merchantData.logo,
					// don't update name so it can be edited by users
				},
			});
		}
		return await prisma.merchant.create({
			data: {
				...merchantData,
				...unique,
			},
		});
	}

};
