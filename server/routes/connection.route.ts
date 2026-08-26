import { ConnectionService } from "server/services/ConnectionService";

export default (fastify, _, done) => {

	// Get all connections for the workspace
	fastify.get('/', async function handler (request, reply) {
		const workspace_id = request.sessionUser.workspace_id;
		const connections = await ConnectionService.getWorkspaceConnections(workspace_id);
		return {
			success: true,
			data: connections,
		};
	});

	// Get connection status for a specific institution
	fastify.get('/:institution_id', async function handler (request, reply) {
		const workspace_id = request.sessionUser.workspace_id;
		const institution_id = request.params.institution_id as string;
		
		try {
			const connection = await ConnectionService.getConnectionStatus(workspace_id, institution_id);
			return {
				success: true,
				data: connection,
			};
		} catch (error: any) {
			console.error('Error fetching connection status:', error);
			reply.status(500).send({
				success: false,
				error: error.message || 'Failed to fetch connection status',
			});
		}
	});

	done();
}
