<script setup lang="ts">
import { useCategoryStore } from '@/stores/category.store';
import CategoryAvatar from './CategoryAvatar.vue';
import { computed, onMounted } from 'vue';
import type { Category } from 'delfi-core/models/Category';

const props = defineProps<{
	currentCategoryId: string | null;
	allowedCategories?: Category[];
}>();
const selectedCategory = computed(() => useCategoryStore().getCategoryById(props.currentCategoryId));

defineEmits<{
	'select': [categoryId: string | null];
}>();

const groups = useCategoryStore().categoriesByGroup
	.map(group => ({
		...group,
		categories: group.categories.filter(cat => !props.allowedCategories || props.allowedCategories.some(c => c.category_id === cat.category_id))
	}))
	.filter(group => group.categories.length > 0);

onMounted(() => {
		if (props.currentCategoryId && selectedCategory) {
			setTimeout(() => {
				const groupElement = document.getElementById(`group_${selectedCategory.value.ParentCategory?.name}`);
				if (groupElement) {
					groupElement.scrollIntoView();
				}
			}, 50)
		}
})

</script>

<template>
	<div class="flex flex-column gap-3">
		<div v-for="group in groups" :key="group.name" class="flex flex-column gap-2">
			<h4 :id="`group_${group.name}`" class="group">{{ group.name }}</h4>
			<div class="flex flex-column">
				<div
					v-for="category in group.categories"
					:key="category.category_id"
					class="flex align-items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 border-round"
					@click="() => $emit('select', category.category_id)"
				>
					<CategoryAvatar
						:category="category"
						:groupColor="group.color"
						style="width: 2rem; height: 2rem;"
					/>
					<div class="flex-grow-1">{{  category.name }}</div>
					<i class="pi pi-check" v-if="currentCategoryId === category.category_id" />
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
</style>
