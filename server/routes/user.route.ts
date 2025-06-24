export default (fastify, _, done) => {

    fastify.get('/session', async (request, reply) => {
        return {
            success: true,
            data: request.sessionUser,
        }
    });

    done();
}