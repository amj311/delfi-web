import type { Merchant, MerchantDraft } from "delfi-core/models/Transaction";
import { prisma } from "../../prisma/client";

export const MerchantDao = {
    async createMerchant(workspace_id: string, merchantData: MerchantDraft) {
        return await prisma.merchant.create({
            data: merchantData,
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

	async getByPlaidMerchantId(plaid_merchant_id: string) {
		return await prisma.merchant.findFirst({
			where: {
				plaid_merchant_id,
			},
		});
	},

	async getMerchantByHostname(hostname: string) {
		// remove protocol and www
		hostname = hostname.replace(/(^\w+:|^)\/\//, '').replace(/^www\./, '');
		// Find merchant with host that INCLUDES the given hostname (to match subdomains)
		return await prisma.merchant.findFirst({
			where: {
				hostname: {
					contains: hostname,
					mode: 'insensitive',
				},
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
};
