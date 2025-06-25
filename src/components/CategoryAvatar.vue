<script setup lang="ts">
import { useCategoryStore } from '@/stores/category.store';
import type { Category } from 'delfi-core/models/Category';
import { colors } from 'delfi-core/utils/constants';
import { computed } from 'vue';
import Icon from './Icon.vue';

const categoryStore = useCategoryStore();

const props = defineProps<{
	category?: Category | null;
	categoryId?: string | null;
}>();

const category = computed(() => props.category || categoryStore.getCategoryById(props.categoryId));
</script>

<template>
	<div class="category-avatar flex align-items-center justify-content-center" :style="{ backgroundColor: colors[category.Group?.color || ''] || '#aaaaaf' }">
		<Icon :name="category.icon || category.Group?.icon || 'question-circle'" color="#fff" />
	</div>
</template>

<style scoped>
.category-avatar {
	aspect-ratio: 1;
	width: 100%;
	height: 100%;
}
</style>
