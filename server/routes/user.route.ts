import { User } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { UserService } from "../services/UserService";

export default (fastify, _, done) => {

    fastify.get('/session', async (request, reply) => {
        return {
            success: true,
            data: request.sessionUser,
        }
    });

    done();
}