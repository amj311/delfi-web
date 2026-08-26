import 'dotenv/config';

import Fastify from "fastify";
import path from "path";
import { createReadStream, readFileSync } from "fs";
import firebaseAuthMiddleware, { firebaseConfig } from "./services/FirebaseService";
import signupRoute from "./routes/signup.route";
import './services/SyncService'; // Import to trigger job creation

// HTTPS was only needed for testing with plaid
// // HTTPS support for development
// const isDevelopment = process.env.NODE_ENV === 'development';
// const httpsOptions = isDevelopment ? {
//     key: readFileSync(path.join(__dirname, 'certs/localhost+2-key.pem')),
//     cert: readFileSync(path.join(__dirname, 'certs/localhost+2.pem'))
// } : {};

const app = Fastify({
	logger: false,
	// https: httpsOptions
});
app.register(require('@fastify/cors'), {
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
});

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
app.register((api, _, done) => {
	api.addHook('preValidation', firebaseAuthMiddleware);

	api.register(require('./routes/transaction.route'), { prefix: '/transactions' });
	api.register(require('./routes/user.route'), { prefix: '/user' });
	api.register(require('./routes/plaid.route'), { prefix: '/plaid' });
	api.register(require('./routes/account.route'), { prefix: '/account' });
	api.register(require('./routes/budget.route'), { prefix: '/budget' });
	api.register(require('./routes/category.route'), { prefix: '/category' });
	api.register(require('./routes/tag.route'), { prefix: '/tag' });
	api.register(require('./routes/group.route'), { prefix: '/group' });
	api.register(require('./routes/merchant.route'), { prefix: '/merchant' });
	api.register(require('./routes/transactionRule.route'), { prefix: '/transaction-rule' });
	api.register(require('./routes/ext-manage.route'), { prefix: '/ext' });
	api.register(require('./routes/connection.route'), { prefix: '/connection' });

	api.setNotFoundHandler((req, reply) => {
		reply.status(404).send({ message: 'Not Found' });
	})

	done();
}, { prefix: '/api' });

// External module routes (i.e. chrome extension)
app.register(require('./routes/ext.route'), { prefix: '/ext' });

// Serving the static app in PROD
app.register(require('@fastify/static'), {
	root: path.join(__dirname, '../dist'),
});
app.setNotFoundHandler((req, reply) => {
	const stream = createReadStream(path.join(__dirname, '../dist') + '/index.html'); // for app sub-routing
	reply.type('text/html').send(stream)
})

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
