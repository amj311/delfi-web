import { AccountService } from "server/services/AccountService";
import { ExternalsService } from "server/services/ExternalsService";
import { InstitutionService } from "server/services/InstitutionService";
import { InstitutionScrapers } from "server/services/scraper/InstitutionScrapers";
import { SyncService } from "server/services/SyncService";

export default (route, _, done) => {
	route.addHook('preValidation', async (request, reply) => {
		// Get Token from header
		const tokenId = request.headers['x-external-token'];
		if (!tokenId) {
			return reply.status(401).send({ message: 'Unauthorized' });
		}
		const validToken = await ExternalsService.getValidToken(tokenId as string);
		if (!validToken) {
			return reply.status(401).send({ message: 'Unauthorized' });
		}

		// Token is valid
		request.ext_token = validToken;
		return;
	});

	route.get('/validate', async (request, reply) => {
		return {
			success: true,
			data: request.ext_token,
		};
	});

    route.get('/scrape-data', async (request, reply) => {
		const workspace_id = request.ext_token.workspace_id;
		const accounts = await AccountService.getAllAccounts(workspace_id);
		const institutions = await InstitutionService.getAllInstitutions();
		const institutionsData = await Promise.all(institutions.filter(i => i.scraper === 'extension').map(institution => ({
			institution_id: institution.institution_id,
			data: institution,
			loginConfig: {
				...InstitutionScrapers[institution.institution_id!],
			},
			creds: InstitutionService.getInstitutionCreds(institution.institution_id, workspace_id),
			accounts: accounts.filter(a => a.institution_id === institution.institution_id),
		})));
		return {
			success: true,
			data: {
				institutions: institutionsData
			}
		};
    });

	route.post('/scraped-accounts', async (request, reply) => {
		const workspace_id = request.ext_token.workspace_id;
		let accounts = request.body;
		if (typeof accounts === 'string') {
			try {
				accounts = JSON.parse(accounts);
			} catch (e) {
				return reply.status(400).send({ message: 'Invalid body, expected array of accounts' });
			}
		}
		if (!Array.isArray(accounts)) {
			return reply.status(400).send({ message: 'Invalid body, expected array of accounts' });
		}
		for (const accountData of accounts) {
			accountData.workspace_id = workspace_id;
			accountData.source = 'scraper';
			await AccountService.upsertAccount(workspace_id, accountData);
		}
		return {
			success: true,
		};
	});


	route.post('/sync-results', async (request, reply) => {
		const workspace_id = request.ext_token.workspace_id;
		let results = request.body;
		if (typeof results === 'string') {
			try {
				results = JSON.parse(results);
			} catch (e) {
				return reply.status(400).send({ message: 'Invalid body, expected array of sync results' });
			}
		}
		console.log(`Received sync results for workspace ${workspace_id}:`, results);
		const newTransactions = await SyncService.ingestAccountSyncs(workspace_id, results);
		return {
			success: true,
			data: {
				newTransactions,
			}
		};
	});
    done();
}