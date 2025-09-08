import type { TransactionRule } from "delfi-core/models/TransactionRule";
import { TransactionRuleDao } from "../data/TransactionRuleDao";
import { TransactionRuleService } from "server/services/TransactionRuleService";

export default (app, _, done) => {

    app.post('/', async function handler (request, reply) {
        const transactionRuleData = request.body;
        const workspace_id = request.sessionUser.workspace_id;
        const data = await TransactionRuleDao.upsertTransactionRule(workspace_id, transactionRuleData);
        return {
            success: true,
            data,
        };
    });

    app.get('/', async function handler (request, reply) {
        const workspace_id = request.sessionUser.workspace_id;
        const data = await TransactionRuleDao.getWorkspaceRules(workspace_id);
        return {
            success: true,
            data,
        };
    });

    app.delete('/:id', async function handler (request, reply) {
        const transactionRuleId = request.params.id;
        const workspace_id = request.sessionUser.workspace_id;
        await TransactionRuleDao.deleteTransactionRule(workspace_id, transactionRuleId);
        return {
            success: true,
        };
    });

    done();
};
