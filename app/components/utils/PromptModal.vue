<script lang="ts">
import { defineComponent, ref, watch, onMounted, onUnmounted, computed } from 'vue';
import Dialog from 'primevue/dialog';
import Drawer from 'primevue/drawer';
import Button, { type ButtonProps } from 'primevue/button';
import InputText from 'primevue/inputtext';
import { defineStore } from 'pinia';
import DrawerModal from './DrawerModal.vue';
import { jsonCopy } from 'delfi-core/utils/miscUtils';
import type { Replace } from 'delfi-core/utils/typeUtils';

// Define the store as a separate export
export type PromptOptions = {
	title?: string;
	message?: string;
	preset?: 'prompt' | 'confirm' | 'delete' | 'archive';
	fields?: Array<FieldConfig>;
	okButtonProps?: ButtonProps;
	cancelButtonProps?: ButtonProps;
};
type FieldConfig<T = any> = {
	key: string;
	label?: string;
	placeholder?: string;
	value?: T;
};

type PromptConfig = Replace<PromptOptions, { fields: Array<FieldConfig> }>;
const Presets: Record<string, PromptConfig> = {
	prompt: {
		fields: [
			{
				key: 'input',
				placeholder: 'Enter text...',
				value: '',
			},
		],
	},
	confirm: {
		title: 'Confirm',
		message: 'Are you sure you want to proceed?',
		okButtonProps: {
			label: 'Confirm',
		},
		fields: [],
	},
	delete: {
		title: 'Delete',
		message: 'Are you sure you want to delete this item?',
		okButtonProps: {
			label: 'Delete',
			severity: 'danger',
		},
		cancelButtonProps: {
			severity: 'secondary',
		},
		fields: [],
	},
	archive: {
		title: 'Archive',
		message: 'Are you sure you want to archive this item?',
		okButtonProps: {
			label: 'Archive',
			severity: 'danger',
		},
		cancelButtonProps: {
			severity: 'secondary',
		},
		fields: [],
	},
};

type PromptResponse = {
	confirmed: boolean;
	values: Record<string, any>;
} | null;

// Private store for accessing and managing the prompt state
// This store is used internally and not exposed to the global state
const usePrivatePrompt = defineStore('privatePrompt', () => {
	const modal = ref<InstanceType<typeof DrawerModal> | null>(null);
	const config = ref<PromptConfig>(Presets.prompt);

	// Resolver functions for the promise
	let resolvePrompt: ((value: PromptResponse) => void) | null = null;

	/**
	 * Open the prompt modal and return a promise that resolves when the user submits or cancels
	 * @param options - Configuration options for the prompt
	 * @returns Promise that resolves to the user's input or null if cancelled
	 */
	function doModal(options: PromptOptions = {}): Promise<PromptResponse> {
		config.value = {
			...(Presets[options.preset || ''] || {}),
			...options,
		};
		// Deep copy fields to avoid mutation issues
		config.value.fields = jsonCopy(config.value.fields || []);

		// Open the prompt modal
		modal.value?.open();

		// Return a new promise that will be resolved when the user interacts with the prompt
		return new Promise<PromptResponse>((resolve) => {
			resolvePrompt = resolve;
		});
	}

	/**
	 * Submit the prompt with the provided value
	 * @param value - The value to submit
	 */
	function submit() {
		if (resolvePrompt) {
			resolvePrompt({
				confirmed: true,
				values: config.value.fields?.reduce((acc, field) => {
					acc[field.key] = field.value;
					return acc;
				}, {} as Record<string, any>),
			});
			resolvePrompt = null;
		}
	}

	/**
	 * Cancel the prompt
	 */
	function cancel() {
		if (resolvePrompt) {
			resolvePrompt(null);
			resolvePrompt = null;
		}
	}

	return {
		setModal(modalRef: InstanceType<typeof DrawerModal> | null) {
			modal.value = modalRef;
		},
		config,
		doModal,
		submit,
		cancel,
	};
});

// Public store for requesting prompts
export const usePrompt = defineStore('prompt', () => {
	return {
		prompt(config: PromptOptions) {
			return usePrivatePrompt().doModal({ ...{ preset: 'prompt' }, ...config });
		},
		confirm(config: PromptOptions) {
			return usePrivatePrompt().doModal({ ...{ preset: 'confirm' }, ...config });
		},
		delete(config: PromptOptions) {
			return usePrivatePrompt().doModal({ ...{ preset: 'delete' }, ...config });
		},
	};
});


// Define the component using Options API
export default {
	name: 'PromptModal',
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
		const modalRef = ref<InstanceType<typeof DrawerModal> | null>(null);

		onMounted(() => {
			// Need to supply the modal ref to the store so it can open it
			store.setModal(modalRef.value);
		});

		function handleSubmit() {
			store.submit();
			close();
		}

		function handleCancel() {
			store.cancel();
			close();
		}

		function close() {
			modalRef.value?.close();
		}

		// Handle Enter key to submit
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === 'Enter' && !event.shiftKey && store.config.fields!.length === 1) {
				event.preventDefault();
				handleSubmit();
			} else if (event.key === 'Escape') {
				handleCancel();
			}
		}

		return {
			config: computed(() => store.config),
			modalRef,
			handleSubmit,
			handleCancel,
			onKeyDown,
		};
	},
};
</script>

<template>
	<DrawerModal ref="modalRef" :title="config.title">
		<div class="flex flex-column gap-2">
			<p v-if="config.message" class="prompt-message">{{ config.message }}</p>

			<div v-for="field of config.fields!" class="p-input-filled w-full">
				<InputText
					v-model="field.value"
					:placeholder="field.placeholder"
					class="w-full"
					autofocus
					@keydown="onKeyDown"
				/>
			</div>
		
			<div class="flex justify-content-end gap-2">
				<Button
					class="p-button-text"
					v-bind="{ ...config.cancelButtonProps }"
					:label="config.cancelButtonProps?.label || 'Cancel'"
					@click="handleCancel"
				/>
				<Button
					v-bind="{ ...config.okButtonProps }"
					:label="config.okButtonProps?.label || 'Submit'"
					@click="handleSubmit"
				/>
			</div>
		</div>
	</DrawerModal>
</template>

<style scoped lang="scss">
</style>
