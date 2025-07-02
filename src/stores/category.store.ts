import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import request from '@/services/request';
import type { Category, ParentCategory } from 'delfi-core/models/Category';
import { TagColor } from 'delfi-core/utils/constants';
import { UncategorizedCategory } from 'delfi-core/models/systemCategories';

export const useCategoryStore = defineStore('category', () => {
	let workspaceCategories = ref([] as ParentCategory[]);
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

	const flatWorkspaceCategories = computed<Array<Category>>(() => workspaceCategories.value.flatMap(parent => {
		return [
			...parent.Children.map(child => ({
				...child,
				ParentCategory: parent,
				color: parent.color as TagColor,
				icon: child.icon || parent.icon,
			})),
			// Represent the parent category as an "other" catch-all
			{
				...parent,
				name: `Other ${parent.name}`,
				Children: undefined, // Remove children from parent category
				ParentCategory: parent,
			}
		];
	}));

	const systemOnlyCategories: Array<Category> = [
		UncategorizedCategory,
	];

	const allCategories = computed(() => {
		return flatWorkspaceCategories.value.concat(systemOnlyCategories);
	})

	function getCategoryById(categoryId?: string | null): Category {
		return allCategories.value.find(c => c.category_id === categoryId) || UncategorizedCategory;
	}

	const categoriesByGroup = computed(() => {
		const groups: Record<string, Category[]> = {};
		allCategories.value.forEach(category => {
			const array = groups[category.ParentCategory?.name || ''] || [];
			array.push(category);
			groups[category.ParentCategory?.name || ''] = array;
		});
		return Array.from(Object.entries(groups)).map(([groupName, categories]) => ({
			name: groupName,
			categories: categories,
			color: categories[0]?.ParentCategory?.color,
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
