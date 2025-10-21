<script lang="ts">
import { ref, TransitionGroup } from 'vue';
import Dialog from 'primevue/dialog';
import Drawer from 'primevue/drawer';
import Button, { type ButtonProps } from 'primevue/button';
import InputText from 'primevue/inputtext';
import { defineStore } from 'pinia';
import DrawerModal from './DrawerModal.vue';
import type { IconIdentifier } from 'delfi-core/utils/constants';
import Icon from '../Icon.vue';
import SwipeAction from './SwipeAction.vue';

// Define the store as a separate export
export type ToastOptions = {
	key?: string;
	title?: string;
	message?: string;
	icon?: IconIdentifier;
	onOk?: () => void;
	okButtonProps?: ButtonProps;
	cancelButtonProps?: ButtonProps;
	duration?: number;
	severity?: 'info' | 'warn' | 'error' | 'success';
};

// Private store for accessing and managing the prompt state
// This store is used internally and not exposed to the global state
const usePrivatePrompt = defineStore('privateToast', () => {
	// const messages = ref<Array<ToastOptions>>([ { message: 'Would you like to automate this assignment?', onOk: () => {}, okButtonProps: { label: 'Create Rule' } } ]);
	const messages = ref<Array<ToastOptions>>([]);

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
	function addMessage(message: ToastOptions = {}): string {
		const key = message.key || Math.random().toString(36).substr(2, 9);
		messages.value.push({
			key,
			...message,
		});
		setTimeout(() => {
			removeMessage(key);
		}, message.duration || 10000); // leave toast around for a while since it usually prompts for user action
		return key;
	}

	return {
		addMessage,
		removeMessage,
		messages,
	};
});

// Public store for requesting prompts
export const useToast = defineStore('toast', () => {
	return {
		add(options: ToastOptions) {
			return usePrivatePrompt().addMessage(options);
		},
		remove(key: string) {
			return usePrivatePrompt().removeMessage(key);
		},
	};
});

// Define the component using Options API
export default {
	name: 'Toast',
	components: {
		Dialog,
		Drawer,
		InputText,
		Button,
		DrawerModal,
		Icon,
		SwipeAction,
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
	<div class="toast-container">
		<div class="list-wrapper">
			<TransitionGroup
				name="toast"
				tag="div"
				enter-active-class="fadeinup"
				leave-active-class="fadeoutright"
			>
				<SwipeAction
					v-for="msg in store.messages"
					:key="msg.key!"
					@left="store.removeMessage(msg.key!)"
				>
					<template #content>
						<div class="p-2">
							<div
								class="flex flex-column gap-2 bg-white border-1 shadow-2 p-2 pl-3 mb-2 border-round"
								:style="{
									borderColor: msg.severity ? `var(--p-message-${msg.severity}-border-color)` : 'var(--p-surface-300)',
									color: msg.severity ? `var(--p-message-${msg.severity}-color)` : '',
								}"
							>
								<div class="flex align-items-center gap-2">
									<Icon v-if="msg.icon" :name="msg.icon" />
									<h4 v-if="msg.title">{{ msg.title }}</h4>
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
								<div v-if="msg.message">
									{{ msg.message }}
								</div>
							</div>
						</div>
					</template>
				</SwipeAction>
			</TransitionGroup>
		</div>
	</div>
</template>

<style scoped lang="scss">
.toast-container {
	position: fixed;
	z-index: 99999;
	top: 0;
	width: 100%;
	height: 0;

	.list-wrapper {
		position: absolute;
		top: 0;
		right: 0;
		max-width: 25rem;
	}
}
</style>
