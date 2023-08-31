import { PlaidService } from "../services/PlaidService";

export default (fastify, _, done) => {

	fastify.get('/link-token', async function handler (request, reply) {
		const tokenData = await PlaidService.getLinkToken();
		return {
			success: true,
			data: tokenData,
		}
	});
	
	done();
}