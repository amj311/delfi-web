<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import Drawer from 'primevue/drawer';
import type { Transaction } from 'delfi-core/models/Transaction';
import NavTrigger from './NavTrigger.vue';
import Button from 'primevue/button';

const { fullMobile = true, ...props } = defineProps<{
	triggerKey: string;
	onClose?: (transaction: Transaction) => void;
	title?: string;
	position?: string;
	width?: number;
	fullMobile?: boolean,
}>();

const drawerTrigger = ref<InstanceType<typeof NavTrigger> | null>(null);
const title = props.title || ' ';

const smallWidth = computed(() => props.width || 30);

defineExpose({
	trigger: () => drawerTrigger.value,
});
</script>

<template>
	<NavTrigger
		ref="drawerTrigger"
		:triggerKey="triggerKey"
		:onClose="props.onClose"
	>
		<template #default="{ show }">
			<Drawer
				:visible="show"
				:position="position || 'right'"
				:header="title"
				:class="[`sm:w-${smallWidth}rem`, { 'w-full': fullMobile }]"
			>
				<template #closebutton>
					<Button icon="pi pi-times" text @click="drawerTrigger?.close" severity="secondary" />
				</template>

				<template v-for="(slotFn, name) in $slots" #[name]="slotProps">
					<slot :name="name" v-bind="slotProps" />
				</template>
			</Drawer>
		</template>
	</NavTrigger>
</template>

<style scoped lang="scss">
</style>
