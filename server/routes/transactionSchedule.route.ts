import { TransactionSchedule } from "@prisma/client";
import { TransactionScheduleService } from "../services/TransactionScheduleService";

export default (fastify, _, done) => {

    fastify.post('/', async function handler (request, reply) {
        const transactionScheduleData = request.body as TransactionSchedule;
        const user_id = request.sessionUser.user_id;
        const data = await TransactionScheduleService.createTransactionSchedule(user_id, transactionScheduleData);
        return {
            success: true,
            data,
        };
    });

    fastify.get('/', async function handler (request, reply) {
        const user_id = request.sessionUser.user_id;
        const data = await TransactionScheduleService.getAllTransactionSchedules(user_id);
        return {
            success: true,
            data,
        };
    });

    fastify.get('/:id', async function handler (request, reply) {
        const transactionScheduleId = request.params.id;
        const user_id = request.sessionUser.user_id;
        const data = await TransactionScheduleService.getTransactionScheduleById(user_id, transactionScheduleId);
        return {
            success: true,
            data,
        };
    });

    fastify.put('/:id', async function handler (request, reply) {
        const transactionScheduleId = request.params.id;
        const transactionScheduleData = request.body as TransactionSchedule;
        const user_id = request.sessionUser.user_id;
        const data = await TransactionScheduleService.updateTransactionSchedule(user_id, transactionScheduleId, transactionScheduleData);
        return {
            success: true,
            data,
        };
    });

    fastify.delete('/:id', async function handler (request, reply) {
        const transactionScheduleId = request.params.id;
        const user_id = request.sessionUser.user_id;
        await TransactionScheduleService.deleteTransactionSchedule(user_id, transactionScheduleId);
        return {
            success: true,
        };
    });

    done();
};