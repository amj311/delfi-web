import type { CreateAccountData } from "server/services/AccountService";
import { AccountDao } from "../data/AccountDao";
import type { Account } from "delfi-core/models/Account";

export default (fastify, _, done) => {

    fastify.post('/', async function handler (request, reply) {
        const accountData = request.body as CreateAccountData;
        const user_id = request.sessionUser.user_id;
        const id = await AccountDao.createAccount(user_id, accountData);
		const data = await AccountDao.getAccountById(user_id, id);
        return {
            success: true,
            data,
        };
    });

    fastify.get('/', async function handler (request, reply) {
        const user_id = request.sessionUser.user_id;
        const data = await AccountDao.getAllAccounts(user_id);
        return {
            success: true,
            data,
        };
    });

    fastify.get('/:id', async function handler (request, reply) {
        const accountId = request.params.id;
        const user_id = request.sessionUser.user_id;
        const data = await AccountDao.getAccountById(user_id, accountId);
        return {
            success: true,
            data,
        };
    });

    fastify.put('/:id', async function handler (request, reply) {
        const accountId = request.params.id;
        const accountData = request.body as Account;
        const user_id = request.sessionUser.user_id;
        const data = await AccountDao.updateAccount(user_id, accountId, accountData);
        return {
            success: true,
            data,
        };
    });

    fastify.delete('/:id', async function handler (request, reply) {
        const accountId = request.params.id;
        const user_id = request.sessionUser.user_id;
        await AccountDao.deleteAccount(user_id, accountId);
        return {
            success: true,
        };
    });

    done();
};