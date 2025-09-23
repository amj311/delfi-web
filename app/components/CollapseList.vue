<script setup lang="ts" generic="T">
import Button from 'primevue/button';
import { computed, ref } from 'vue';

const { items = [], max = 5 } = defineProps<{
	items: T[];
	max?: number;
}>();

const expand = ref(false);

const shownItems = computed(() => {
	return items.slice(0, expand.value ? items.length : max);
});
</script>

<template>
	<div class="collapse-list" style="display: contents">
		<template v-for="(item, index) in shownItems" :key="index">
			<slot :item="item" :index="index">{{ item }}</slot>
		</template>
		<div v-if="items.length > max" class="text-center mt-2 cursor-pointer" @click="expand = !expand">
			<Button text>
				{{ expand ? 'Show Less' : `Show All (${items.length})` }}
			</Button>
		</div>
	</div>
</template>

<style scoped></style>
