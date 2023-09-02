import * as dotenv from "dotenv"
dotenv.config({
	path: '../.env'
})

import Fastify from "fastify";
import plaidRoute from "./routes/plaid.route";


const fastify = Fastify({
	logger: false
});



// Declare a route
fastify.get('/', async function handler (request, reply) {
	return { hello: 'world' }
});
fastify.register(require('@fastify/cors'));
fastify.register(plaidRoute, { prefix: '/plaid' });



// Run the server!
(async () => {
	try {
		await fastify.listen({ port: 3000 })
		console.log('Server started')
	} catch (err) {
		fastify.log.error(err)
		process.exit(1)
	}	
})();
