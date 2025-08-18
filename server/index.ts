import 'dotenv/config';

import Fastify from "fastify";
import path from "path";
import { createReadStream, readFileSync } from "fs";
import axios from "axios";
import { calculateRelevanceScore, norm, similarityScore } from "./utils/textSimilarity";
import { findCompanyWebsite, printCompanySearchResults } from "./services/CompanySearchService";
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
		
		// Test LangSearch API when server starts
		// testLangSearch();
	} catch (err) {
		console.error(err)
		process.exit(1)
	}
})();

/**
 * Test function for LangSearch API
 * Makes a search request for "cafe rio" using the LANGSEARCH_API_KEY from env
 */
/**
 * Test function for demonstrating the company website finder functionality
 */
async function testLangSearch() {
	// Example company name to search for
	const companySearch = "WINCO FOODS";

	try {
		// Search for the company website
		const results = await findCompanyWebsite(companySearch);

		if (results && results.length > 0) {
			const mostLikelyWebsite = results[0];
			console.log(`Most likely website for "${companySearch}": ${mostLikelyWebsite.domain}`);
			// Load website HTML and find icons
			const { data } = await axios.get(mostLikelyWebsite.domain);
			const html = data as string;

			// Extract name from og:site_name
			const metaNameMatch = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+>/i)?.[0].match(/content=["']([^"']+)["']/)?.[1];
			const pagTitle = html.match(/<title>(.*?)<\/title>/i)?.[1];

			// Split title or site_name into parts
			const nameCandidates = [metaNameMatch, pagTitle].flatMap(str => {
				const parts: Array<string> = [];
				if (str) {
					const isStr = str.toString();
					parts.push(...isStr.split(' - ').map(p => p.split(' | ')).flat().map(p => p.split(', ')).flat().map(p => p.trim()));
				}
				return parts;
			}).map(part => part.trim()).filter(Boolean).map(part => ({
				part,
				score: similarityScore(norm(part), norm(companySearch)),
			})).sort((a, b) => b.score - a.score);

			console.log("Best name candidates:", nameCandidates[0].part);

			// Find the best icon URL
			const bestIconPath = extractIconPath(html);
			if (bestIconPath) {
				const bestIconUrl = bestIconPath?.startsWith('http') ? bestIconPath : new URL(bestIconPath || '', mostLikelyWebsite.domain).href;
				console.log("Best icon URL:", bestIconUrl);
			}
		}
	} catch (error) {
		console.error('❌ Company search test failed:', error);
	}
}

function extractIconPath(html: string): string | null {
	// Icon link rels
	type IconMatch = {
		source: string, // Source of the icon (e.g., og:image)
		path: string,
		size?: number,
	}
	const iconUrls: Array<IconMatch> = [];

	const iconLinkRels = ['icon', 'shortcut icon', 'apple-touch-icon', 'apple-touch-icon-precomposed'];			
	iconLinkRels.forEach(rel => {
		const regex = new RegExp(`<link[^>]+rel=["']${rel}["'][^>]+>`, 'gi');
		let match;
		while ((match = regex.exec(html)) !== null) {
			const fullLink = match[0];
			const sizeMatch = fullLink.match(/sizes=["'](\d+x\d+)["']/);
			const size = sizeMatch ? parseInt(sizeMatch[1].split('x')[0], 10) : undefined; // Get width if available
			const iconPath = fullLink.match(/href=["']([^"']+)["']/)?.[1];
			if (!iconPath) continue; // Skip if no href found
			// If path does not start with http, prepend the base URL.
			iconUrls.push({
				source: rel,
				// path: iconPath.startsWith('http') ? iconPath : new URL(iconPath, mostLikelyWebsite.url).href,
				path: iconPath,
				size: size,
			});
		}
	});
	const metaIconProperties = ['og:image'];
	metaIconProperties.forEach(property => {
		const regex = new RegExp(`<meta[^>]+property=["']${property}["'][^>]+>`, 'gi');
		let match;
		while ((match = regex.exec(html)) !== null) {
			const fullMeta = match[0];
			const iconPath = fullMeta.match(/content=["']([^"']+)["']/)?.[1];
			if (!iconPath) continue; // Skip if no content found
			iconUrls.push({
				source: property,
				path: iconPath,
			});
		}
	});

	iconUrls.sort((a, b) => {
		// Apple icons come first
		if (a.source.includes('apple') && !b.source.includes('apple')) {
			return -1;
		}
		if (!a.source.includes('apple') && b.source.includes('apple')) {
			return 1;
		}

		// If it has no size, prefer the other
		if (!a.size && b.size) {
			return 1; 
		}
		if (!b.size && a.size) {
			return -1;
		}
		
		if (a.size && b.size) {
			return b.size - a.size; // Sort by size descending
		}
		return 0; // If sizes are not available, keep original order
	});

	console.log("Extracted icon URLs:", iconUrls);

	return iconUrls.length > 0 ? iconUrls[0].path : null;
}
