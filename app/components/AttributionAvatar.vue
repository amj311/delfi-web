<script setup lang="ts">
import { computed, ref } from 'vue';
import Icon from './Icon.vue';
import { colors, type IconIdentifier } from 'delfi-core/utils/constants';
import type { Category } from 'delfi-core/models/Category';
import { useCategoryStore } from '@/stores/category.store';

const props = defineProps<{
	event?: {
		Merchant?: {
			logo?: string | null;
		} | null;
		Category?: {
			icon?: IconIdentifier;
			color?: string;
			ParentCategory?: {
				icon?: IconIdentifier;
				color?: string;
			} | null;
		} | null;
	};
	image?: string | null;
	icon?: IconIdentifier;
	background?: string;
	category?: Category | null;
	categoryId?: string | null;
	size?: number; // rems
	square?: boolean;
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
const imageError = ref(false);
function setImageError() {
	console.warn('Error loading image:', finalImage.value);
	imageError.value = true;
}

const category = computed(
	() =>
		props.category ||
		props.event?.Category ||
		useCategoryStore().getCategoryById(props.categoryId)
);
const finalIcon = computed(() => {
	return props.icon || category.value?.icon || category.value?.ParentCategory?.icon || 'category';
});
const backgroundColor = computed(() => {
	return (
		props.background ||
		category.value?.color ||
		category.value?.ParentCategory?.color ||
		'#aaaaaf'
	);
});
</script>

<template>
	<div class="avatar-wrapper" :style="{ width: `${props.size}rem`, height: `${props.size}rem`, fontSize: `${fontSize}rem` }">
		<div class="attribution-avatar" :class="{ square }">
			<img v-if="finalImage && !imageError" :src="finalImage" @error="setImageError" />
			<template v-else>
				<div
					class="icon-wrapper flex align-items-center justify-content-center"
					:style="{ backgroundColor: colors[backgroundColor] || backgroundColor }"
				>
					<Icon :name="finalIcon" color="#fff" />
				</div>
			</template>
		</div>
		<div v-if="$slots.badge" class="badge shadow-1">
			<slot name="badge" />
		</div>
	</div>
</template>

<style scoped lang="scss">
.avatar-wrapper {
	display: inline-flex;
	justify-content: center;
	align-items: center;
	position: relative;

	.attribution-avatar {
		color: #fff;
		aspect-ratio: 1;
		width: 100%;
		height: 100%;
		overflow: hidden;
		display: inline-flex;
		justify-content: center;
		align-items: center;
		border-radius: 50%;

		&.square {
			border-radius: 5px;
		}

		img {
			width: 100%;
			height: 100%;
			object-fit: contain;
		}

		.icon-wrapper {
			aspect-ratio: 1;
			width: 100%;
			height: 100%;
		}
	}

	.badge {
		font-size: 0.7em;
		--size: 1.7em;

		position: absolute;
		bottom: -0.25em;
		right: -0.25em;
		color: black;
		background: white;
		display: flex;
		align-items: center;
		justify-content: center;
		height: var(--size);
		aspect-ratio: 1;
		overflow: hidden;
		border-radius: 50%;
	}
}
</style>
