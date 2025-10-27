<script setup lang="ts">
import { ref } from 'vue';
import { colors, TagColor } from 'delfi-core/utils/constants';
import Button from 'primevue/button';
import DrawerModal from './utils/DrawerModal.vue';
import AttributionAvatar from './AttributionAvatar.vue';

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
		<div class="color-grid">
			<div>
				<Button text severity="secondary" @click="selectColor(null)">
					<AttributionAvatar icon="material-symbols::format_color_reset" :background="colors.gray6" :size="3"  />
				</Button>
			</div>
			<div v-for="color of TagColor" :key="color">
				<Button :text="color === selectedColor ? false : true" severity="secondary" @click="selectColor(color)">
					<AttributionAvatar :icon="color === selectedColor ? 'material-symbols::check' : null" :background="colors[color]" :size="3"  />
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
