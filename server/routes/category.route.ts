import { UserCategory } from "../../models/types";
import { CategoryService } from "../services/CategoryService";

export default (fastify, _, done) => {

    fastify.post('/', async function handler (request, reply) {
        const categoryData = request.body as UserCategory;
        const data = await CategoryService.createUserCategory(categoryData);
        return {
            success: true,
            data,
        };
    });

    fastify.get('/', async function handler (request, reply) {
		const user_id = request.sessionUser.user_id;
		const data = await CategoryService.getUserCategories(user_id);
        return {
            success: true,
            data,
        };
    });

    fastify.get('/:id', async function handler (request, reply) {
		const user_id = request.sessionUser.user_id;
		const category_id = request.params.id;
        const data = await CategoryService.getCategoryById(user_id, category_id);
        return {
            success: true,
            data,
        };
    });

    fastify.put('/:id', async function handler (request, reply) {
        const category_id = request.params.id;
        const categoryData = request.body as UserCategory;
		const user_id = request.sessionUser.user_id;
		const data = await CategoryService.updateCategory(user_id, category_id, categoryData);
        return {
            success: true,
            data,
        };
    });

    fastify.delete('/:id', async function handler (request, reply) {
		const user_id = request.sessionUser.user_id;
		const category_id = request.params.id;
        await CategoryService.deleteCategory(user_id, category_id);
        return {
            success: true,
        };
    });

    done();
};