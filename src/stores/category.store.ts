import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import request from '@/services/request';
import type { Category } from 'delfi-core/models/Category';
import { TagColor } from 'delfi-core/utils/constants';
import { UncategorizedCategory } from 'delfi-core/models/systemCategories';

export const useCategoryStore = defineStore('category', () => {
	let workspaceCategories = ref([] as any[]);
	let isLoadingCategories = ref(false);

	async function loadCategories() {
		try {
			isLoadingCategories.value = true;
			const { data } = await request.get('/category');
			workspaceCategories.value = data.data;
		}
		catch (e) {
			console.error("Could not load categories!")
		}
		finally {
			isLoadingCategories.value = false;
		}
	}

	const systemOnlyCategories: Array<Category> = [
		UncategorizedCategory,
	];

	const allCategories = computed(() => {
		return workspaceCategories.value.concat(systemOnlyCategories);
	})

	function getCategoryById(categoryId?: string | null): Category {
		return allCategories.value.find(c => c.category_id === categoryId) || UncategorizedCategory;
	}

	const categoriesByGroup = computed(() => {
		const groups: Record<string, Category[]> = {};
		allCategories.value.forEach(category => {
			if (!groups[category.Group?.name]) {
				groups[category.Group?.name] = [];
			}
			groups[category.Group?.name].push(category);
		});
		return Array.from(Object.entries(groups)).map(([groupName, categories]) => ({
			name: groupName,
			categories: categories.sort((a, b) => a.name.localeCompare(b.name)),
			color: categories[0]?.Group?.color,
		}));
	});

	return {
		allCategories,
		workspaceCategories,
		isLoadingCategories,
		loadCategories,
		getCategoryById,
		categoriesByGroup,
	};
})
