import { PlaidService } from "../services/PlaidService";

export default (fastify, _, done) => {

	fastify.get('/link-token', async function handler (request, reply) {
		const tokenData = await PlaidService.getLinkToken();
		return {
			success: true,
			data: tokenData,
		}
	});

	fastify.post('/new-connection', async function handler (request, reply) {
		const { public_token } = request.body;
		const accessTokenData = await PlaidService.saveNewConnection(public_token);
		console.log(accessTokenData)
		return {};
	});
	
	done();
}