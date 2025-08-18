import type { Merchant } from "delfi-core/models/Transaction";
import { MerchantDao } from "server/data/MerchantDao";


export const MerchantService = {
    async createWorkspaceMerchant(merchantData: Omit<Merchant, 'merchant_id'>) {
        // return await prisma.merchant.create({
        //     data: merchantData,
        // });
    },

    async getWorkspaceMerchants(workspace_id: string) {
		return await MerchantDao.getAllMerchants(workspace_id);
    },

    async getMerchantById(workspace_id: string, merchant_id: string) {
        // return await prisma.workspaceDefinedMerchant.findUnique({
        //     where: {
        //         merchant_id,
		// 		workspace_id,
        //     },
        // });
    },

    async updateMerchant(workspace_id: string, merchant_id: string, merchantData: Partial<Merchant>) {
        // return await prisma.workspaceDefinedMerchant.update({
        //     where: {
        //         merchant_id,
		// 		workspace_id,
        //     },
        //     data: merchantData,
        // });
    },

    async deleteMerchant(workspace_id, merchant_id: string) {
        // await prisma.workspaceDefinedMerchant.delete({
        //     where: {
        //         merchant_id,
		// 		workspace_id,
        //     },
        // });
    },
};