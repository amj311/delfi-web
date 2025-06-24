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

	// gets all parent merchants for user, with children nested
    async getAllMerchants(): Promise<Merchant[]>  {
        const merchants: any[] = await prisma.merchant.findMany();
		// return merchants.concat(Object.values(my_merchants))
		return merchants;
    },

    async getMerchantById(merchantId: string) {
        return await prisma.merchant.findUnique({
            where: {
                merchant_id: merchantId,
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
