import type { CreateAccountData } from "server/services/AccountService";
import { AccountDao } from "../data/AccountDao";
import type { Account } from "delfi-core/models/Account";
import { TransactionService } from "server/services/TransactionService";
import { SyncService } from "server/services/SyncService";
import { useTransaction } from "../../prisma/client";
import { ScraperService } from "server/services/scraper/ScraperService";

export default (fastify, _, done) => {

	fastify.post('/sync', async function handler (request, reply) {
		const workspace_id = request.sessionUser.workspace_id;
		await SyncService.syncWorkspaceAccounts(workspace_id);
		const data = await AccountDao.getAllAccounts(workspace_id);
		return {
			success: true,
			data,
		};
	});

    fastify.post('/sync/submit-otp', async function handler (request, reply) {
        const workspace_id = request.sessionUser.workspace_id;
        const { institution_id, otp } = request.body as { institution_id: string; otp: string };
        await ScraperService.submitOtp(otp, institution_id, workspace_id);
        return {
            success: true,
         };
     });


    fastify.post('/', async function handler (request, reply) {
        const accountData = request.body as CreateAccountData;
        const workspace_id = request.sessionUser.workspace_id;
        const newAccount = await AccountDao.createAccount(workspace_id, accountData);
		const data = await AccountDao.getAccountById(workspace_id, newAccount.account_id);
        return {
            success: true,
            data,
        };
    });

    fastify.get('/', async function handler (request, reply) {
        const workspace_id = request.sessionUser.workspace_id;
        const data = await AccountDao.getAllAccounts(workspace_id);
        return {
            success: true,
            data,
        };
    });

    fastify.get('/:id', async function handler (request, reply) {
        const accountId = request.params.id;
        const workspace_id = request.sessionUser.workspace_id;
        const data = await AccountDao.getAccountById(workspace_id, accountId);
        return {
            success: true,
            data,
        };
    });


    fastify.get('/:id/transactions', async function handler (request, reply) {
        const accountId = request.params.id;
        const workspace_id = request.sessionUser.workspace_id;
        const data = await useTransaction(tx => TransactionService.tx(tx).getTransactionsForAccount(workspace_id, accountId));
        return {
            success: true,
            data,
        };
    });

    fastify.post('/:id/sync', async function handler (request, reply) {
        const accountId = request.params.id;
        const workspace_id = request.sessionUser.workspace_id;
        await SyncService.syncWorkspaceAccounts(workspace_id, [accountId]);
        return {
            success: true,
        };
    });

    fastify.put('/:id', async function handler (request, reply) {
        const accountId = request.params.id;
        const accountData = request.body as Account;
        const workspace_id = request.sessionUser.workspace_id;
        const data = await AccountDao.updateAccount(workspace_id, accountId, accountData);
        return {
            success: true,
            data,
        };
    });

    fastify.delete('/:id', async function handler (request, reply) {
        const accountId = request.params.id;
        const workspace_id = request.sessionUser.workspace_id;
        await AccountDao.deleteAccount(workspace_id, accountId);
        return {
            success: true,
        };
    });

    fastify.post('/:id/archive', async function handler (request, reply) {
        const accountId = request.params.id;
        const workspace_id = request.sessionUser.workspace_id;
        const data = await AccountDao.updateAccount(workspace_id, accountId, { archived: true });
        return {
            success: true,
            data,
         };
     });

	 done();
};