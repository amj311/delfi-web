import { prisma } from "../../prisma/client";

export const TransactionReviewDao = {
    async createTransactionReview(workspace_id: string, transaction_id: string, assignee?: string) {
		const workspaceMatch = await prisma.workspace.findUnique({
			where: {
				workspace_id,
				Transactions: {
					some: {
						transaction_id,
					},
				},
				Users: {
					some: {
						user_id: assignee,
					}
				}
			},
		});

		if (!workspaceMatch) {
			throw new Error(`Transaction or user do not exist in workspace with ID ${workspace_id}`);
		}

        return await prisma.transactionReview.create({
			data: {
				workspace_id,
				transaction_id,
				assigned_to_id: assignee || null,
			}
		});
    },

	async markTransactionReviewed(workspace_id: string, transaction_id: string, user_id?: string) {
		let reviewRecord = await prisma.transactionReview.findUnique({
			where: {
				transaction_id,
				workspace_id,
			},
		});
		if (!reviewRecord) {
			throw new Error(`Review for transaction with ID ${transaction_id} not found`);
		}

		return await prisma.transactionReview.update({
			where: {
				transaction_review_id: reviewRecord.transaction_review_id,
			},
			data: {
				reviewed_at: new Date(),
				reviewed_by_id: user_id,
			},
			include: { ReviewedBy: true }
		});
	},

    // async getAllMerchants(workspace_id: string): Promise<Merchant[]>  {
    //     const merchants: any[] = await prisma.merchant.findMany({
	// 		orderBy: {
	// 			name: 'asc',
	// 		},
	// 	});
	// 	return merchants;
    // },

    // async getMerchantById(merchantId: string) {
    //     return await prisma.merchant.findUnique({
    //         where: {
    //             merchant_id: merchantId,
    //         },
    //     });
    // },

	// async getByPlaidMerchantId(plaid_merchant_id: string) {
	// 	return await prisma.merchant.findFirst({
	// 		where: {
	// 			plaid_merchant_id,
	// 		},
	// 	});
	// },

	// async getMerchantByHostname(hostname: string) {
	// 	return await prisma.merchant.findFirst({
	// 		where: {
	// 			hostname,
	// 		},
	// 	});
	// },

	// async getMerchantCategory(workspace_id: string, merchant_id: string) {
	// 	const merchant = await prisma.merchant.findUnique({
	// 		where: {
	// 			merchant_id, // could be either global or workspace
	// 		},
	// 	});

	// 	if (!merchant) {
	// 		throw new Error(`Merchant with ID ${merchant_id} not found`);
	// 	}

	// 	const categoryAssociation = merchant.detection_key;
	// 	return await prisma.categoryDetectionMapping.findUnique({
	// 		where: {
	// 			workspace_id_detection_key: {
	// 				workspace_id,
	// 				detection_key: categoryAssociation || '',
	// 			},
	// 		},
	// 		include: {
	// 			Category: true, // Include the category details
	// 		},
	// 	});
	// },

    // async updateMerchant(merchantId: string, merchantData: Merchant) {
	// 	return await prisma.merchant.update({
    //         where: {
    //             merchant_id: merchantId,
    //         },
    //         data: merchantData,
    //     });
    // },
};
