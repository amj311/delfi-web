<script setup lang="ts">
import CategoryAvatar from './CategoryAvatar.vue';

defineProps<{
	event: any;
}>();
</script>

<template>
	<div class="transaction-avatar">
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
