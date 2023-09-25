import * as dotenv from "dotenv"
dotenv.config({
	path: '../.env'
})

import Fastify from "fastify";
import plaidRoute from "./routes/plaid.route";
import accountRoute from "./routes/account.route";
import transactionScheduleRoute from "./routes/transactionSchedule.route";
import userRoute from "./routes/user.route";
import firebaseAuthMiddleware, { firebaseConfig } from "./services/FirebaseService";


const app = Fastify({
	logger: false
});
app.register(require('@fastify/cors'));

app.get('/firebase-config', () => {
	return {
		data: firebaseConfig
	}
});

// protected routes
app.register((fastify, _, done) => {
	fastify.addHook('preValidation', firebaseAuthMiddleware);

	app.register(userRoute, { prefix: '/user' });
	app.register(plaidRoute, { prefix: '/plaid' });
	app.register(accountRoute, { prefix: '/account' });
	app.register(transactionScheduleRoute, { prefix: '/transactionSchedule' });

	done();
}, { prefix: '/' });

app.setErrorHandler((error: any, request) => {
	console.error(`❌ ${request.method} ${request.url}:`)
	console.error(error)
	if (error.isApiError) {
		throw error;
	}
	return {
		statusCode: 500,
		message: "Internal Server Error"
	}
});

// Run the server!
(async () => {
	try {
		await app.listen({ port: 3000 })
		console.log('Server started')
	} catch (err) {
		console.error(err)
		process.exit(1)
	}	
})();
