<script setup lang="ts">
import { computed, ref } from 'vue';
import Icon from './Icon.vue';
import { colors, type IconIdentifier } from 'delfi-core/utils/constants';
import type { Category } from 'delfi-core/models/Category';
import { useCategoryStore } from '@/stores/category.store';
import type { CommonEvent } from 'delfi-core/models/Summary';
import { useAccountStore } from '@/stores/account.store';
import { UncategorizedCategory } from 'delfi-core/models/systemCategories';

const props = defineProps<{
	event?: Partial<CommonEvent>;
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

const category = computed(
	() =>
		props.category ||
		props.event?.Category ||
		useCategoryStore().getCategoryById(props.categoryId)
);
const finalIcon = computed(() => {
	return props.icon || category.value?.icon || category.value?.ParentCategory?.icon;
});
const backgroundColor = computed(() => {
	return (
		props.background ||
		category.value?.color ||
		category.value?.ParentCategory?.color ||
		'#aaaaaf'
	);
});


const finalImage = computed(() => {
	if (props.image) return props.image;
	if (props.event?.Merchant?.logo) return props.event?.Merchant?.logo;
	// Trying to diminish the visual effect of uncategorized transactions.
	// If there is no category, just show the bank logo
	if (category.value === UncategorizedCategory) return useAccountStore().getAccountById(props.event?.attributionDetails?.sourceTransaction.account_id)?.Institution.logo;
	return '';
});
const imageError = ref(false);
function setImageError() {
	console.warn('Error loading image:', finalImage.value);
	imageError.value = true;
}
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
