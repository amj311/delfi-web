import { User } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { UserService } from "../services/UserService";

export default (fastify, _, done) => {

	fastify.post('/create-account', async (request, reply) => {
		const data = request.body as Omit<User, 'user_id'>;
		const user = await UserService.createUser(data);
		return {
			success: true,
			data: user
		}
	})

    done();
}