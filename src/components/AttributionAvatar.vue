<script setup lang="ts">
import { computed } from 'vue';
import Icon from './Icon.vue';
import { colors, type IconName } from 'delfi-core/utils/constants';
import type { Category } from 'delfi-core/models/Category';
import { useCategoryStore } from '@/stores/category.store';
import type { CommonEvent } from 'delfi-core/models/Summary';

const props = defineProps<{
	event?: {
		Merchant?: {
			logo?: string | null;
		} | null;
		Category?: {
			icon?: IconName;
			color?: string;
			ParentCategory?: {
				icon?: IconName;
				color?: string;
			} | null;
		} | null;
	};
	image?: string;
	icon?: IconName;
	background?: string;
	category?: Category;
	categoryId?: string;
	size?: number; // rems
}>();

const width = computed(() => {
	return props.size || 2;
});

const fontSize = computed(() => {
	return 0.5 * width.value;
});

const finalImage = computed(() => {
	return props.image || props.event?.Merchant?.logo || '';
});
const category = computed(() => props.category || props.event?.Category || useCategoryStore().getCategoryById(props.categoryId));
const finalIcon = computed(() => {
	return props.icon || category.value?.icon || category.value?.ParentCategory?.icon || 'category';
});
const backgroundColor = computed(() => {
	return props.background || category.value?.color || category.value?.ParentCategory?.color || '#aaaaaf';
});

</script>

<template>
	<div class="attribution-avatar" :style="{ fontSize: `${fontSize}rem`, width: `${props.size}rem` }">
		<img
			v-if="finalImage"
			:src="finalImage"
		/>
		<template v-else>
			<div class="icon-wrapper flex align-items-center justify-content-center" :style="{ backgroundColor: colors[backgroundColor] || backgroundColor }">
				<Icon :name="finalIcon" color="#fff" />
			</div>
		</template>
	</div>
</template>

<style scoped>
.attribution-avatar {
	color: #fff;
    aspect-ratio: 1;
    overflow: hidden;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;

	img {
		width: 100%;
		object-fit: cover;
	}

	.icon-wrapper {
		aspect-ratio: 1;
		width: 100%;
		height: 100%;
	}
}
</style>
