import 'dotenv/config';

import Fastify from "fastify";
import path from "path";
import { createReadStream, readFileSync } from "fs";
import firebaseAuthMiddleware, { firebaseConfig } from "./services/FirebaseService";
import signupRoute from "./routes/signup.route";
import './services/SyncService'; // Import to trigger job creation

// HTTPS support for development
const isDevelopment = !("RENDER" in process.env);
const httpsOptions = isDevelopment ? {
  https: {
    key: readFileSync(path.join(__dirname, 'certs/localhost+2-key.pem')),
    cert: readFileSync(path.join(__dirname, 'certs/localhost+2.pem'))
  }
} : {};

const app = Fastify({
	logger: false,
	...httpsOptions
});
app.register(require('@fastify/cors'));

app.get('/firebase-config', () => {
	return {
		data: firebaseConfig
	}
});

// Signup routes
app.register(signupRoute, { prefix: '/signup' });

app.addHook('onResponse', (request, reply) => {
	const sign = reply.statusCode >= 200 && reply.statusCode < 300 ? '✅' : '❌';
	console.log(`${sign} ${reply.statusCode} - ${request.method} ${request.url}`);
});

// authenticated routes
app.register((authRoutes, _, done) => {
	authRoutes.addHook('preValidation', firebaseAuthMiddleware);

	authRoutes.register(require('./routes/transaction.route'), { prefix: '/transactions' });
	authRoutes.register(require('./routes/user.route'), { prefix: '/user' });
	authRoutes.register(require('./routes/plaid.route'), { prefix: '/plaid' });
	authRoutes.register(require('./routes/account.route'), { prefix: '/account' });
	authRoutes.register(require('./routes/budget.route'), { prefix: '/budget' });
	authRoutes.register(require('./routes/category.route'), { prefix: '/category' });
	authRoutes.register(require('./routes/tag.route'), { prefix: '/tag' });
	authRoutes.register(require('./routes/group.route'), { prefix: '/group' });
	authRoutes.register(require('./routes/merchant.route'), { prefix: '/merchant' });

	done();
}, { prefix: '/' });


// // Serving the static app in PROD
// app.register(require('@fastify/static'), {
// 	root: path.join(__dirname, '../dist'),
// });
// app.setNotFoundHandler((req, reply) => {
// 	const stream = createReadStream(path.join(__dirname, '../dist') + '/index.html'); // for app sub-routing
// 	reply.type('text/html').send(stream)
// })

app.setErrorHandler((error: any, request, reply) => {
	console.error('\nError: ', error)
	if (error.isApiError) {
		throw error;
	}
	reply.status(500).send({
		message: "Internal Server Error"
	});
});

// Run the server!
(async () => {
	try {
		const port = Number(process.env.PORT || 5000);
		const host = `0.0.0.0`; // Listen on all interfaces to allow external connections
		await app.listen({ port, host });
		console.log(`Server started and listening on ${host}:${port}`)
	} catch (err) {
		console.error(err)
		process.exit(1)
	}
})();
