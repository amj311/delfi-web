import { TransactionDao } from "server/data/TransactionDao";
import MerchantService from "../services/MerchantService";
import { MerchantDao } from "server/data/MerchantDao";
import type { Merchant, MerchantDraft } from "delfi-core/models/Transaction";

export default (fastify, _, done) => {

    // fastify.post('/', async function handler (request, reply) {
    //     const merchantData = request.body as BaseMerchantDetails;
    //     const data = await MerchantService.createWorkspaceMerchant(merchantData);
    //     return {
    //         success: true,
    //         data,
    //     };
    // });

    fastify.get('/', async function handler (request, reply) {
		const workspace_id = request.sessionUser.workspace_id;
		const data = await MerchantService.getWorkspaceMerchants(workspace_id);
        return {
            success: true,
            data,
        };
    });

    fastify.post('/', async function handler (request, reply) {
		const workspace_id = request.sessionUser.workspace_id;
		const merchantData = request.body as MerchantDraft;
		const data = await MerchantDao.createMerchant(workspace_id, merchantData);
        return {
            success: true,
            data,
        };
    });

    fastify.post('/:id', async function handler (request, reply) {
        const merchant_id = request.params.id;
        const merchantData = request.body as Merchant;
		const workspace_id = request.sessionUser.workspace_id;
		const data = await MerchantService.updateMerchant(workspace_id, merchant_id, merchantData);
        return {
            success: true,
            data,
        };
    });

	// Search for merchant to match transaction
	fastify.get('/findTransactionMerchant/:transaction_id', async function handler (request, reply) {
		const transaction_id = request.params.transaction_id;
		const transaction = await TransactionDao.getTransactionById(transaction_id);
		if (!transaction) {
			throw new Error(`Transaction with ID ${transaction_id} not found`);
		}
		const results = await MerchantService.searchForTransactionMerchants([transaction]);
		return {
			success: true,
			data: results[0]?.merchant || null,
		};
	});


    // fastify.delete('/:id', async function handler (request, reply) {
	// 	const workspace_id = request.sessionUser.workspace_id;
	// 	const merchant_id = request.params.id;
    //     await MerchantService.deleteMerchant(workspace_id, merchant_id);
    //     return {
    //         success: true,
    //     };
    // });

    done();
};