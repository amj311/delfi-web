import { NotificationService } from "server/services/NotificationService";
import { UserService } from "server/services/UserService";

export default (fastify, _, done) => {

    fastify.get('/session', async (request, reply) => {
        return {
            success: true,
            data: request.sessionUser,
        }
    });
	
	// update profile details
	fastify.put('/', async (request, reply) => {
		const {
			given_name,
			family_name,
			email,
			email_notifs,
			push_notifs,
		} = request.body;

		const data = await UserService.updateUser(request.sessionUser.user_id, {
			given_name,
			family_name,
			email,
			email_notifs,
			push_notifs,
		});
		
        return {
            success: true,
			data,
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