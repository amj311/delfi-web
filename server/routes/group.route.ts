import type { BudgetGroup } from "delfi-core/models/Transaction";
import { BudgetGroupDao } from "../data/GroupDao";

export default (app, _, done) => {

    app.post('/', async function handler (request, reply) {
        const groupData = request.body as BudgetGroup;
        const data = await BudgetGroupDao.createGroup(groupData);
        return {
            success: true,
            data,
        };
    });

    app.get('/', async function handler (request, reply) {
        const data = await BudgetGroupDao.getAllGroups();
        return {
            success: true,
            data,
        };
    });

    app.get('/:id', async function handler (request, reply) {
        const groupId = request.params.id;
        const data = await BudgetGroupDao.getGroupById(groupId);
        return {
            success: true,
            data,
        };
    });

    app.put('/:id', async function handler (request, reply) {
        const groupId = request.params.id;
        const groupData = request.body as BudgetGroup;
        const data = await BudgetGroupDao.updateGroup(groupId, groupData);
        return {
            success: true,
            data,
        };
    });

    app.delete('/:id', async function handler (request, reply) {
        const groupId = request.params.id;
        await BudgetGroupDao.deleteGroup(groupId);
        return {
            success: true,
        };
    });

    done();
};
