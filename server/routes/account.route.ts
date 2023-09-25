import { Account } from "@prisma/client";
import { AccountService } from "../services/AccountService";

export default (fastify, _, done) => {

    fastify.post('/', async function handler (request, reply) {
        const accountData = request.body as Account;
        const user_id = request.sessionUser.user_id;
        const data = await AccountService.createAccount(user_id, accountData);
        return {
            success: true,
            data,
        };
    });

    fastify.get('/', async function handler (request, reply) {
        const user_id = request.sessionUser.user_id;
        const data = await AccountService.getAllAccounts(user_id);
        return {
            success: true,
            data,
        };
    });

    fastify.get('/:id', async function handler (request, reply) {
        const accountId = request.params.id;
        const user_id = request.sessionUser.user_id;
        const data = await AccountService.getAccountById(user_id, accountId);
        return {
            success: true,
            data,
        };
    });

    fastify.put('/:id', async function handler (request, reply) {
        const accountId = request.params.id;
        const accountData = request.body as Account;
        const user_id = request.sessionUser.user_id;
        const data = await AccountService.updateAccount(user_id, accountId, accountData);
        return {
            success: true,
            data,
        };
    });

    fastify.delete('/:id', async function handler (request, reply) {
        const accountId = request.params.id;
        const user_id = request.sessionUser.user_id;
        await AccountService.deleteAccount(user_id, accountId);
        return {
            success: true,
        };
    });

    done();
};