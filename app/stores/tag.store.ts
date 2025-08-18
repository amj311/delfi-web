import { ref } from 'vue'
import { defineStore } from 'pinia'
import request from '@/services/request';
import type { Tag } from 'delfi-core/models/Transaction';

export const useTagStore = defineStore('tag', () => {
	let tags = ref([] as Tag[]);
	let isLoadingTags = ref(false);
	let isUpsertingTag = ref(false);
	let isDeletingTag = ref(false);

	async function loadTags() {
		try {
			isLoadingTags.value = true;
			const { data } = await request.get('/tag');
			tags.value = data.data;
		}
		catch (e) {
			console.error("Could not load tags!")
		}
		finally {
			isLoadingTags.value = false;
		}

	}

	function getTagById (id?: string) {
		return tags.value.find(a => a.tag_id === id);
	}

	async function syncTags() {
		try {
			const { data } = await request.post('/tag/sync');
			tags.value = data.data;
		}
		catch (e) {
			console.error("Could not sync tags!")
		}
	}

	async function syncTag(tagId: string) {
		try {
			const { data } = await request.post(`/tag/${tagId}/sync`);
			const tag = data.data;
			// Update the tag in the store
			tags.value = tags.value.map(a => a.tag_id === tagId ? tag : a);
			// Also update the delfi store
			// delfiStore.updateTag(tag);
		}
		catch (e) {
			console.error("Could not sync tag!")
		}
	}

	const upsertTag = async (tagData: Partial<Tag>): Promise<Tag> => {
		let tagRes: Tag;
		try {
			isUpsertingTag.value = true;
			let { data } = tagData.tag_id
				? await request.put(`/tag/${tagData.tag_id}`, tagData)
				: await request.post('/tag', tagData);
			tagRes = data.data;
			tagData.tag_id ?
				tags.value = tags.value.map(a => a.tag_id === tagData.tag_id ? tagRes : a)
				: tags.value.push(tagRes);
		}
		catch (e) {
			console.error(e)
			throw ('Could not upsert tag');
		}
		finally {
			isUpsertingTag.value = false;
		} 
		return tagRes;
	}

	const deleteTag = async (tagId: string) => {
		try {
			isDeletingTag.value = true;
			await request.delete(`/tag/${tagId}`);
			tags.value = tags.value.filter(a => a.tag_id !== tagId)
		}
		catch (e) {
			console.error(e)
			throw ('Could not upsert tag');
		}
		finally {
			isDeletingTag.value = false;
		} 
	}

	loadTags().catch((error) => {
		console.error("Error loading tags:", error);
	});

	return {
		tags,
		isLoadingTags,
		loadTags,
		syncTags,
		syncTag,
		getTagById,
		upsertTag,
		deleteTag
	};
})
