import { ref } from 'vue'
import { defineStore } from 'pinia'
import request from '@/services/request';
import { my_scheduledTransactions } from './myData';

// interface Category extends CategoryDef {}

// class Category {
//     constructor(def: Category) {
//         Object.assign(this, def);
//     }
// }

export const useCategoryStore = defineStore('category', () => {
	let categories = ref([] as any[]);
	let isLoadingCategorys = ref(false);

	async function loadCategories() {
		try {
			isLoadingCategorys.value = true;
			const { data } = await request.get('/category');
			categories.value = data.data;
			// categorys.value = my_scheduledTransactions;
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
