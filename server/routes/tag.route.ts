import type { Tag } from "delfi-core/models/Transaction";
import { TagService } from "../data/TagDao";

export default (app, _, done) => {

    app.post('/', async function handler (request, reply) {
        const tagData = request.body as Tag;
        const data = await TagService.createTag(tagData);
        return {
            success: true,
            data,
        };
    });

    app.get('/', async function handler (request, reply) {
        const data = await TagService.getAllTags();
        return {
            success: true,
            data,
        };
    });

    app.get('/:id', async function handler (request, reply) {
        const tagId = request.params.id;
        const data = await TagService.getTagById(tagId);
        return {
            success: true,
            data,
        };
    });

    app.put('/:id', async function handler (request, reply) {
        const tagId = request.params.id;
        const tagData = request.body as Tag;
        const data = await TagService.updateTag(tagId, tagData);
        return {
            success: true,
            data,
        };
    });

    app.delete('/:id', async function handler (request, reply) {
        const tagId = request.params.id;
        await TagService.deleteTag(tagId);
        return {
            success: true,
        };
    });

    done();
};
