<script setup lang="ts" generic="T">
import type { IconIdentifier } from 'delfi-core/utils/constants';
import Button from 'primevue/button';
import { computed, ref } from 'vue';

const { items = [], max = 5, itemHeight = 50 } = defineProps<{
	items: T[];
	max?: number;
	openLabel?: string,
	openIcon?: IconIdentifier,
	closeLabel?: string,
	closeIcon?: IconIdentifier,
	itemHeight?: number,
}>();

const expand = ref(false);

const initItems = computed(() => {
	return items.slice(0, max);
});
const hiddenItems = computed(() => {
	return items.slice(max, items.length);
});
</script>

<template>
	<div class="collapse-list" :class="{expand}" style="display: contents">
		<template v-for="(item, index) in initItems" :key="index">
			<slot :item="item" :index="index">{{ item }}</slot>
		</template>
		<div class="extras" :style="{ maxHeight: expand ? `${itemHeight * hiddenItems.length}px` : 0}">
			<template v-for="(item, index) in hiddenItems" :key="index">
				<slot :item="item" :index="index">{{ item }}</slot>
			</template>
		</div>
		<div v-if="items.length > max" class="text-center p-2 cursor-pointer" @click="expand = !expand">
			<Button class="w-full" text>
				<template v-if="expand">
					{{ closeLabel || 'Show Less' }}
				</template>
				<template v-else>
					{{ openLabel || `Show All (${items.length})` }}
				</template>
			</Button>
		</div>
	</div>
</template>

<style scoped>
	.extras {
		overflow-y: hidden;
		transition: 200ms;
	}
</style>
