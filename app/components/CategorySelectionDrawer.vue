<script setup lang="ts">
import { computed, ref } from 'vue';
import NavTriggerDrawer from './utils/NavTrigger/NavTriggerDrawer.vue';
import { useCategoryStore } from '@/stores/category.store';
import type { Category } from 'delfi-core/models/Category';
import CategorySelector from './CategorySelector.vue';

const triggerRef = ref<InstanceType<typeof NavTriggerDrawer> | null>(null);
let resolvePromise: ((category: string | null) => void) | null = null;
const selectedCategoryId = ref<string>('');

defineExpose({
	selectCategory: (currentCategoryId?: string | null) => {
		return new Promise<string | null>((resolve) => {
			resolvePromise = resolve;
			selectedCategoryId.value = currentCategoryId || '';
			triggerRef.value?.trigger()?.open();
		});
	}
});

function selectCategoryId(category_id: string | null) {
	selectedCategoryId.value = category_id || '';
	if (resolvePromise) {
		resolvePromise(category_id || null);
		resolvePromise = null;
	}
	triggerRef.value?.trigger()?.close();
}

function cancelSelection() {
	if (resolvePromise) {
		resolvePromise(selectedCategoryId.value || null);
		resolvePromise = null;
	}
}

</script>

<template>
	<NavTriggerDrawer ref="triggerRef" triggerKey="select-category" title="Select Category" @close="cancelSelection" :width="25">
		<CategorySelector
			:currentCategoryId="selectedCategoryId || null"
			@select="selectCategoryId"
		/>
	</NavTriggerDrawer>
</template>

<style scoped lang="scss">
</style>
