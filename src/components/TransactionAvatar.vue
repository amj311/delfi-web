<script setup lang="ts">
import { computed } from 'vue';
import CategoryAvatar from './CategoryAvatar.vue';

const props = defineProps<{
	event: any;
	size?: number; // rems
}>();

const width = computed(() => {
	return props.size || 2;
});

const fontSize = computed(() => {
	return 0.5 * width.value;
});

</script>

<template>
	<div class="transaction-avatar" :style="{ fontSize: `${fontSize}rem`, width: `${props.size}rem` }">
		<img
			v-if="event.Merchant?.logo"
			:src="event.Merchant.logo"
		/>
		<template v-else>
			<CategoryAvatar
				:category="event.Category"
				:categoryId="event.category_id"
			/>
		</template>
	</div>
</template>

<style scoped>
.transaction-avatar {
	color: #fff;
    aspect-ratio: 1;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;

	img {
		width: 100%;
		object-fit: cover;
	}
}
</style>
