import { ExternalsService } from "server/services/ExternalsService";

export default (fastify, _, done) => {

    fastify.get('/tokens', async (request, reply) => {
        return {
            success: true,
            data: await ExternalsService.getWorkspaceTokens(request.sessionUser.workspace_id),
        }
    });

    done();
}