<script setup lang="ts">
import { useCategoryStore } from '@/stores/category.store';
import { computed, onMounted } from 'vue';
import type { Category } from 'delfi-core/models/Category';
import { ref } from 'vue';
import InputText from 'primevue/inputtext';
import AttributionAvatar from './AttributionAvatar.vue';

const props = defineProps<{
	currentCategoryId: string | null;
	allowedCategories?: Category[];
}>();
const selectedCategory = computed(() => useCategoryStore().getCategoryById(props.currentCategoryId));

defineEmits<{
	select: [categoryId: string | null];
}>();

onMounted(() => {
	if (props.currentCategoryId && selectedCategory) {
		setTimeout(() => {
			const groupElement = document.getElementById(`group_${selectedCategory.value.ParentCategory?.name}`);
			if (groupElement) {
				groupElement.scrollIntoView();
			}
		}, 50);
	}
});

const search = ref<string>('');

const groups = computed(() =>
	useCategoryStore()
		.categoriesByGroup.map((group) => ({
			...group,
			categories: group.categories
				.filter((cat) => !props.allowedCategories || props.allowedCategories.some((c) => c.category_id === cat.category_id))
				.filter(
					(c) =>
						!search.value.trim() ||
						c.name.toLowerCase().includes(search.value.trim().toLowerCase()) ||
						group.name.toLowerCase().includes(search.value.trim().toLowerCase())
				),
		}))
		.filter((group) => group.categories.length > 0)
);
</script>

<template>
	<div class="flex flex-column h-full">
		<div v-if="!allowedCategories" class="flex align-items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 border-round" @click="() => $emit('select', null)">
			<AttributionAvatar :icon="'category'" style="width: 2rem; height: 2rem" />
			<div class="flex-grow-1">Uncategorized</div>
			<i class="pi pi-check" v-if="!currentCategoryId" />
		</div>
		<div
			v-if="currentCategoryId && selectedCategory"
			class="flex align-items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 border-round"
			@click="() => $emit('select', selectedCategory.category_id)"
		>
			<AttributionAvatar :category="selectedCategory" style="width: 2rem; height: 2rem" />
			<div class="flex-grow-1">{{ selectedCategory.name }}</div>
			<i class="pi pi-check" v-if="currentCategoryId === selectedCategory.category_id" />
		</div>

		<div class="searchbar">
			<InputText v-model="search" placeholder="Search..." class="w-full" />
			<i class="pi pi-search"></i>
		</div>
		<div class="flex flex-column gap-3 overflow-y-auto">
			<div v-for="group in groups" :key="group.name" class="flex flex-column gap-2">
				<h4 :id="`group_${group.name}`" class="group">{{ group.name }}</h4>
				<div class="flex flex-column">
					<div
						v-for="category in group.categories"
						:key="category.category_id"
						class="flex align-items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 border-round"
						@click="() => $emit('select', category.category_id)"
					>
						<AttributionAvatar :category="category" style="width: 2rem; height: 2rem" />
						<div class="flex-grow-1">{{ category.name }}</div>
						<i class="pi pi-check" v-if="currentCategoryId === category.category_id" />
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
.searchbar {
	position: relative;
	padding: 0.5rem 0;
	background: var(--color-background);
	z-index: 2;

	> i.pi {
		position: absolute;
		right: 0.7rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--p-text-color);
	}
}
.group {
	position: sticky;
	top: 0;
	z-index: 1;
	background: #fff;
	padding: .25rem 0;
}
</style>
