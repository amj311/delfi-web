import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import request from '@/services/request';
import type { Category } from 'delfi-core/models/Category';

export const useCategoryStore = defineStore('category', () => {
	let workspaceCategories = ref([] as any[]);
	let isLoadingCategorys = ref(false);

	async function loadCategories() {
		try {
			isLoadingCategorys.value = true;
			const { data } = await request.get('/category');
			workspaceCategories.value = data.data;
		}
		catch (e) {
			console.error("Could not load categories!")
		}
	}

	const systemOnlyCategories: Array<Category> = [
		{
			category_id: null as any,
			name: 'Uncategorized',
			type: 'EXPENSE',
			group_id: '',
		}
	];

	const allCategories = computed(() => {
		return workspaceCategories.value.concat(systemOnlyCategories);
	})

	return {
		allCategories,
		workspaceCategories,
		isLoadingCategorys,
		loadCategories,
	};
})
