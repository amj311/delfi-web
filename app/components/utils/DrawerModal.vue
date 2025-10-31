<script lang="ts" setup>
import { defineComponent, ref, watch, onMounted, onUnmounted, computed, onBeforeMount, onBeforeUnmount } from 'vue';
import Dialog from 'primevue/dialog';
import Drawer from 'primevue/drawer';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { defineStore } from 'pinia';
import NavTrigger from './NavTrigger/NavTrigger.vue';

// Define the component using Options API
const navTriggerRef = ref<InstanceType<typeof NavTrigger> | null>(null);
const isMobile = ref(false);

const { closeable = true } = defineProps<{
	title?: string;
	width?: string;
	closeable?: boolean,
}>();

/**
 * Checks if the device is mobile based on screen width
 */
function checkMobileScreen() {
	isMobile.value = window.innerWidth < 576;
}

onBeforeMount(() => {
	checkMobileScreen();
	window.addEventListener('resize', checkMobileScreen);
});

onBeforeUnmount(() => {
	window.removeEventListener('resize', checkMobileScreen);
});

defineExpose({
	open: () => {
		navTriggerRef.value?.open();
	},
	close: () => {
		navTriggerRef.value?.close();
	},
})

</script>

<template>
	<NavTrigger ref="navTriggerRef" triggerKey="prompt-modal">
		<template #default="{ show }">
			<template v-if="show">
				<!-- Dialog for desktop view -->
				<Dialog
					v-if="!isMobile"
					:visible="show"
					:header="title"
					:modal="true"
					:style="{ width: width || '30rem' }"
				>
					<slot></slot>
					<template #closebutton>
						<Button text severity="secondary" class="border-circle" icon="pi pi-times" v-if="closeable" @click="() => navTriggerRef?.close()"></Button>
					</template>
					<template v-for="(slotFn, name) in $slots" #[name]="slotProps">
						<slot :name="name" v-bind="slotProps" />
					</template>
				</Dialog>

				<!-- Drawer for mobile view -->
				<Drawer
					v-else
					:visible="show"
					:header="title"
					position="bottom"
					:style="{ height: 'auto', maxHeight: '100vh' }"
				>
					<slot></slot>
					<template #closebutton>
						<Button text severity="secondary" class="border-circle" icon="pi pi-times" v-if="closeable" @click="() => navTriggerRef?.close()"></Button>
					</template>
					<template v-for="(slotFn, name) in $slots" #[name]="slotProps">
						<slot :name="name" v-bind="slotProps" />
					</template>
				</Drawer>
			</template>
		</template>
	</NavTrigger>
</template>

<style scoped lang="scss">
</style>
