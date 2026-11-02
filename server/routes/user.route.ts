import { NotificationService } from "server/services/NotificationService";

export default (fastify, _, done) => {

    fastify.get('/session', async (request, reply) => {
        return {
            success: true,
            data: request.sessionUser,
        }
    });
	

    fastify.post('/push_sub', async (request, reply) => {
		const subscription = request.body;
		if (!subscription) {
			return reply.code(400);
		}
		await NotificationService.registerPushSubscription(request.sessionUser.user_id, subscription);
		
        return {
            success: true,
        }
    });

    done();
}