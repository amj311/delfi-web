import { ref } from 'vue'
import { defineStore } from 'pinia'
import request from '@/services/request';

export const useCategoryStore = defineStore('category', () => {
	let categories = ref([] as any[]);
	let isLoadingCategorys = ref(false);

	async function loadCategories() {
		try {
			isLoadingCategorys.value = true;
			const { data } = await request.get('/category');
			categories.value = data.data;
		}
		catch (e) {
			console.error("Could not load categories!")
		}

	}

	return {
		categories,
		isLoadingCategorys,
		loadCategories,
	};
})
