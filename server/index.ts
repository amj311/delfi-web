import * as dotenv from "dotenv"
dotenv.config({
	path: '../.env'
})

import Fastify from "fastify";
import plaidRoute from "./routes/plaid.route";
import accountRoute from "./routes/account.route";
import plannedTransactionRoute from "./routes/plannedTransaction.route";
import budgetRoute from "./routes/budget.route";
import categoryRoute from "./routes/category.route";
import userRoute from "./routes/user.route";
import firebaseAuthMiddleware, { firebaseConfig } from "./services/FirebaseService";
import signupRoute from "./routes/signup.route";


const app = Fastify({
	logger: false
});
app.register(require('@fastify/cors'));

app.get('/firebase-config', () => {
	return {
		data: firebaseConfig
	}
});

// Signup routes
app.register(signupRoute, { prefix: '/signup' });


// authenticated routes
app.register((authRoutes, _, done) => {
	authRoutes.addHook('preValidation', firebaseAuthMiddleware);

	authRoutes.register(userRoute, { prefix: '/user' });
	authRoutes.register(plaidRoute, { prefix: '/plaid' });
	authRoutes.register(accountRoute, { prefix: '/account' });
	authRoutes.register(plannedTransactionRoute, { prefix: '/plannedTransaction' });
	authRoutes.register(budgetRoute, { prefix: '/budget' });
	authRoutes.register(categoryRoute, { prefix: '/category' });

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
		const port = Number(process.env.PORT || 3000);
		const host = ("RENDER" in process.env) ? `0.0.0.0` : `localhost`;
		await app.listen({ port, host });
		console.log('Server started')
	} catch (err) {
		console.error(err)
		process.exit(1)
	}	
})();
