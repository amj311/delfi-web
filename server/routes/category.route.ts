import type { CategoryDetails } from "delfi-core/models/Category";
import { CategoryService } from "../services/CategoryService";

export default (fastify, _, done) => {

    fastify.post('/', async function handler (request, reply) {
        const categoryData = request.body as CategoryDetails;
        const data = await CategoryService.createWorkspaceCategory(categoryData);
        return {
            success: true,
            data,
        };
    });

    fastify.get('/', async function handler (request, reply) {
		const workspace_id = request.sessionUser.workspace_id;
		const data = await CategoryService.getWorkspaceCategories(workspace_id);
        return {
            success: true,
            data,
        };
    });

    fastify.get('/:id', async function handler (request, reply) {
		const workspace_id = request.sessionUser.workspace_id;
		const category_id = request.params.id;
        const data = await CategoryService.getCategoryById(workspace_id, category_id);
        return {
            success: true,
            data,
        };
    });

    fastify.put('/:id', async function handler (request, reply) {
        const category_id = request.params.id;
        const categoryData = request.body as CategoryDetails;
		const workspace_id = request.sessionUser.workspace_id;
		const data = await CategoryService.updateCategory(workspace_id, category_id, categoryData);
        return {
            success: true,
            data,
        };
    });

    fastify.delete('/:id', async function handler (request, reply) {
		const workspace_id = request.sessionUser.workspace_id;
		const category_id = request.params.id;
        await CategoryService.deleteCategory(workspace_id, category_id);
        return {
            success: true,
        };
    });

    done();
};