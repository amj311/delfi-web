import type { Group } from "delfi-core/models/Transaction";
import { GroupDao } from "../data/GroupDao";

export default (app, _, done) => {

    app.post('/', async function handler (request, reply) {
        const groupData = request.body as Group;
        const data = await GroupDao.createGroup(groupData);
        return {
            success: true,
            data,
        };
    });

    app.get('/', async function handler (request, reply) {
        const data = await GroupDao.getAllGroups();
        return {
            success: true,
            data,
        };
    });

    app.get('/:id', async function handler (request, reply) {
        const groupId = request.params.id;
        const data = await GroupDao.getGroupById(groupId);
        return {
            success: true,
            data,
        };
    });

    app.put('/:id', async function handler (request, reply) {
        const groupId = request.params.id;
        const groupData = request.body as Group;
        const data = await GroupDao.updateGroup(groupId, groupData);
        return {
            success: true,
            data,
        };
    });

    app.delete('/:id', async function handler (request, reply) {
        const groupId = request.params.id;
        await GroupDao.deleteGroup(groupId);
        return {
            success: true,
        };
    });

    done();
};
