import { PlaidService } from "../services/PlaidService";

export default (fastify, _, done) => {
	// Get a link token to initialize Plaid Link
	fastify.get('/link-token', async function handler (request, reply) {
		try {
			// Get user ID from authentication if available
			// const userId = request.user?.id || 'user-id';
			const userId = 'user-id'; // Replace with authenticated user ID when ready
			
			// Get redirect URI from query params if provided (for OAuth flows)
			const redirectUri = request.query?.redirect_uri;
			
			const tokenData = await PlaidService.getLinkToken(userId, redirectUri);
			return {
				success: true,
				data: tokenData,
			};
		} catch (error: any) {
			console.error('Error creating link token:', error);
			reply.status(500).send({
				success: false,
				error: error.message || 'Failed to create link token',
			});
		}
	});

	// Exchange public token for access token and store account data
	fastify.post('/new-connection', async function handler (request, reply) {
		try {
			const { public_token, metadata } = request.body;
			
			if (!public_token) {
				return reply.status(400).send({
					success: false,
					error: 'Missing required parameter: public_token'
				});
			}
			
			await PlaidService.saveNewConnection(request.sessionUser.workspace_id, public_token, metadata);
			
			return {
				success: true,
				message: 'Account connected successfully'
			};
		} catch (error: any) {
			console.error('Error in token exchange:', error);
			reply.status(500).send({
				success: false,
				error: error.message || 'Failed to connect account',
			});
		}
	});
	
	// Add webhook handler for transaction updates
	fastify.post('/webhook', async function handler (request, reply) {
		try {
			const webhookData = request.body;
			
			// Log the webhook for debugging
			console.log('Received Plaid webhook:', webhookData);
			
			// Process different webhook types
			switch (webhookData.webhook_type) {
				case 'TRANSACTIONS':
					// Handle transaction updates
					// TODO: Implement transaction update processing
					break;
					
				case 'ITEM':
					// Handle item updates (e.g., when credentials need to be updated)
					// TODO: Implement item update processing
					break;
					
				// Add other webhook types as needed
			}
			
			return { received: true };
		} catch (error: any) {
			console.error('Error processing webhook:', error);
			return { received: true }; // Always return 200 OK for webhooks
		}
	});
	
	// // Get transactions for a specific account
	// fastify.get('/account/:accountId/transactions', async function handler (request, reply) {
	// 	console.log('Fetching transactions for account:', request.params.accountId);
	// 	try {
	// 		const accountId = request.params.accountId;
			
	// 		if (!accountId) {
	// 			return reply.status(400).send({
	// 				success: false,
	// 				error: 'Missing required parameter: accountId'
	// 			});
	// 		}
			
	// 		const transactionData = await PlaidService.getAccountTransactions(request.sessionUser.workspace_id, accountId);
			
	// 		return {
	// 			success: true,
	// 			data: transactionData
	// 		};
	// 	} catch (error: any) {
	// 		console.error('Error fetching account transactions:', error);
	// 		reply.status(500).send({
	// 			success: false,
	// 			error: error.message || 'Failed to fetch transactions'
	// 		});
	// 	}
	// });
	
	done();
}