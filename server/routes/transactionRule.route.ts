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

    app.get('/applicable/:transaction_id', async function handler (request, reply) {
        const transaction_id = request.params.transaction_id;
        const workspace_id = request.sessionUser.workspace_id;
        const data = await TransactionRuleService.getApplicableRules(workspace_id, transaction_id);
        return {
            success: true,
            data,
        };
    });

    app.post('/apply', async function handler (request, reply) {
        const { transaction_id, rules } = request.body;
        const workspace_id = request.sessionUser.workspace_id;
        
        if (!transaction_id) {
            return reply.code(400).send({
                success: false,
                error: 'transaction_id is required',
            });
        }
        
        if (!rules || !Array.isArray(rules) || rules.length === 0) {
            return reply.code(400).send({
                success: false,
                error: 'rules array is required and must not be empty',
            });
        }

        const data = await TransactionRuleService.applySpecificRulesToTransaction(workspace_id, transaction_id, rules);
        return {
            success: true,
            data,
        };
    });

    done();
};
