<script lang="ts">
import { defineComponent, ref, watch, onMounted, onUnmounted, computed, TransitionGroup } from 'vue';
import Dialog from 'primevue/dialog';
import Drawer from 'primevue/drawer';
import Button, { type ButtonProps } from 'primevue/button';
import InputText from 'primevue/inputtext';
import { defineStore } from 'pinia';
import DrawerModal from './DrawerModal.vue';
import { jsonCopy } from 'delfi-core/utils/miscUtils';
import type { Replace } from 'delfi-core/utils/typeUtils';

// Define the store as a separate export
export type SnackbarOptions = {
	key?: string;
	title?: string;
	message?: string;
	onOk?: () => void;
	okButtonProps?: ButtonProps;
	cancelButtonProps?: ButtonProps;
	duration?: number;
};

// Private store for accessing and managing the prompt state
// This store is used internally and not exposed to the global state
const usePrivatePrompt = defineStore('privateSnackbar', () => {
	// const messages = ref<Array<SnackbarOptions>>([ { message: 'Would you like to automate this assignment?', onOk: () => {}, okButtonProps: { label: 'Create Rule' } } ]);
	const messages = ref<Array<SnackbarOptions>>([]);

	function removeMessage(key: string) {
		const index = messages.value.findIndex((msg) => msg.key === key);
		if (index !== -1) {
			messages.value.splice(index, 1);
		}
	}

	/**
	 * Open the prompt modal and return a promise that resolves when the user submits or cancels
	 * @param options - Configuration options for the prompt
	 * @returns Promise that resolves to the user's input or null if cancelled
	 */
	function addMessage(message: SnackbarOptions = {}): string {
		const key = message.key || Math.random().toString(36).substr(2, 9);
		messages.value.push({
			key,
			...message,
		});
		setTimeout(() => {
			removeMessage(messages.value[0].key || '');
		}, message.duration || 3000);
		return key;
	}

	return {
		addMessage,
		removeMessage,
		messages,
	};
});

// Public store for requesting prompts
export const useSnackbar = defineStore('snackbar', () => {
	return {
		add(options: SnackbarOptions) {
			return usePrivatePrompt().addMessage(options);
		},
		remove(key: string) {
			return usePrivatePrompt().removeMessage(key);
		},
	};
});

// Define the component using Options API
export default {
	name: 'Snackbar',
	components: {
		Dialog,
		Drawer,
		InputText,
		Button,
		DrawerModal,
	},
	setup() {
		// Use the store in the component
		const store = usePrivatePrompt();

		return {
			store,
		};
	},
};
</script>

<template>
	<div class="snackbar-container">
		<div class="list-wrapper p-3">
			<TransitionGroup name="snackbar" tag="div" enter-active-class="fadeindown" leave-active-class="fadeoutright">
				<div v-for="msg in store.messages" :key="msg.key" class="flex align-items-center gap-2 bg-white border-1-surface-300 shadow-2 py-2 pl-3 pr-1 mt-2 border-round">
					<div>
						<h4 v-if="msg.title">{{ msg.title }}</h4>
						<div>{{ msg.message }}</div>
					</div>
					<div class="flex-grow-1"></div>
					<Button
						v-if="msg.onOk"
						:label="'OK'"
						:severity="'secondary'"
						size="small"
						v-bind="msg.okButtonProps"
						@click="
							() => {
								msg.onOk && msg.onOk();
								store.removeMessage(msg.key || '');
							}
						"
					/>
					<Button
						:severity="'secondary'"
						size="small"
						text
						icon="pi pi-times"
						v-bind="msg.cancelButtonProps"
						@click="() => store.removeMessage(msg.key || '')"
					/>
				</div>
			</TransitionGroup>
		</div>
	</div>
</template>

<style scoped lang="scss">
.snackbar-container {
	position: fixed;
	z-index: 99999;
	bottom: 0;
	width: 100%;
	height: 0;

	.list-wrapper {
		position: absolute;
		bottom: 0;
		right: 0;
	}
}
</style>
