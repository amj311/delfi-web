<script setup lang="ts">
import { useCategoryStore } from '@/stores/category.store';
import type { Category } from 'delfi-core/models/Category';
import { colors } from 'delfi-core/utils/constants';
import { computed } from 'vue';
import AttributionAvatar from './AttributionAvatar.vue';

const categoryStore = useCategoryStore();

const props = defineProps<{
	category?: Category | null;
	categoryId?: string | null;
}>();

const category = computed(() => props.category || categoryStore.getCategoryById(props.categoryId));

</script>

<template>
	<AttributionAvatar
		:icon="category.icon || category.ParentCategory?.icon || 'category'"
		:background="colors[category.color || category.ParentCategory?.color || ''] || '#aaaaaf'"
	/>
</template>

<style scoped>
</style>
