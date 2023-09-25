import { Category } from "@prisma/client";
import { CategoryService } from "../services/CategoryService";

export default (fastify, _, done) => {

    fastify.post('/', async function handler (request, reply) {
        const categoryData = request.body as Category;
        const data = await CategoryService.createCategory(categoryData);
        return {
            success: true,
            data,
        };
    });

    fastify.get('/', async function handler (request, reply) {
        const data = await CategoryService.getAllCategories();
        return {
            success: true,
            data,
        };
    });

    fastify.get('/:id', async function handler (request, reply) {
        const categoryId = request.params.id;
        const data = await CategoryService.getCategoryById(categoryId);
        return {
            success: true,
            data,
        };
    });

    fastify.put('/:id', async function handler (request, reply) {
        const categoryId = request.params.id;
        const categoryData = request.body as Category;
        const data = await CategoryService.updateCategory(categoryId, categoryData);
        return {
            success: true,
            data,
        };
    });

    fastify.delete('/:id', async function handler (request, reply) {
        const categoryId = request.params.id;
        await CategoryService.deleteCategory(categoryId);
        return {
            success: true,
        };
    });

    done();
};