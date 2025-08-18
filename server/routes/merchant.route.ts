import { MerchantService } from "../services/MerchantService";

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

    fastify.get('/:id', async function handler (request, reply) {
		const workspace_id = request.sessionUser.workspace_id;
		const merchant_id = request.params.id;
        const data = await MerchantService.getMerchantById(workspace_id, merchant_id);
        return {
            success: true,
            data,
        };
    });

    // fastify.put('/:id', async function handler (request, reply) {
    //     const merchant_id = request.params.id;
    //     const merchantData = request.body as BaseMerchantDetails;
	// 	const workspace_id = request.sessionUser.workspace_id;
	// 	const data = await MerchantService.updateMerchant(workspace_id, merchant_id, merchantData);
    //     return {
    //         success: true,
    //         data,
    //     };
    // });

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