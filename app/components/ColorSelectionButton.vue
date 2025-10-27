<script setup lang="ts">
import { ref } from 'vue';
import { colors, TagColor } from 'delfi-core/utils/constants';
import Button from 'primevue/button';
import DrawerModal from './utils/DrawerModal.vue';

const triggerRef = ref<InstanceType<typeof DrawerModal> | null>(null);
const selectedColor = defineModel<TagColor | null | undefined>();

function selectColor(color: TagColor | null) {
	selectedColor.value = color || null;
	triggerRef.value?.close();
}

</script>

<template>
	<Button @click="triggerRef?.open" class="input-button flex align-items-center gap-2" text severity="secondary">
		<div class="w-2rem square border-circle" :style="{ backgroundColor: colors[selectedColor || ''] || colors.gray3 }"></div>
		<i class="pi pi-chevron-down" />
	</Button>

	<DrawerModal ref="triggerRef" triggerKey="select-color" title="Select Color" width="32rem">
		<Button icon="pi pi-eraser" label="No color" severity="secondary" @click="selectColor(null)" />
		<div class="color-grid">
			<div v-for="color of TagColor" :key="color">
				<Button text severity="secondary" @click="selectColor(color)">
					<div class="w-3rem square border-circle" :style="{ backgroundColor: colors[color] }"></div>
				</Button>
			</div>
		</div>
	</DrawerModal>
</template>

<style scoped lang="scss">
.color-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(5rem, 1fr));
}
</style>
