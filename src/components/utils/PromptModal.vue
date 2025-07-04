<script lang="ts">
import { defineComponent, ref, watch, onMounted, onUnmounted, computed } from 'vue';
import Dialog from 'primevue/dialog';
import Drawer from 'primevue/drawer';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { defineStore } from 'pinia';
import NavTrigger from './NavTrigger.vue';


// Define the store as a separate export
export type PromptOptions = {
	title?: string;
	message?: string;
	placeholder?: string;
	defaultValue?: string;
};

// Private store for accessing and managing the prompt state
// This store is used internally and not exposed to the global state
const usePrivatePrompt = defineStore('prompt', () => {
	const navTrigger = ref<InstanceType<typeof NavTrigger> | null>(null);

	const title = ref<string>('Input Required');
	const message = ref<string>('');
	const placeholder = ref<string>('Enter text...');
	const defaultValue = ref<string>('');
	const isMobile = ref(false);

	// Resolver functions for the promise
	let resolvePrompt: ((value: string | null) => void) | null = null;

	/**
	 * Checks if the device is mobile based on screen width
	 */
	function checkMobileScreen() {
		isMobile.value = window.innerWidth < 768; // Common breakpoint for mobile devices
	}


	/**
	 * Open the prompt modal and return a promise that resolves when the user submits or cancels
	 * @param options - Configuration options for the prompt
	 * @returns Promise that resolves to the user's input or null if cancelled
	 */
	function prompt(options: PromptOptions = {}): Promise<string | null> {
		// Set up the prompt with provided options
		title.value = options.title ?? 'Input Required';
		message.value = options.message ?? '';
		placeholder.value = options.placeholder ?? 'Enter text...';
		defaultValue.value = options.defaultValue ?? '';

		// Check screen size before opening
		checkMobileScreen();
		window.addEventListener('resize', checkMobileScreen);

		// Open the prompt modal
		navTrigger.value?.open();

		// Return a new promise that will be resolved when the user interacts with the prompt
		return new Promise<string | null>((resolve) => {
			resolvePrompt = resolve;
		});
	}

	function close() {
		navTrigger.value?.close();
		window.removeEventListener('resize', checkMobileScreen);
	}

	/**
	 * Submit the prompt with the provided value
	 * @param value - The value to submit
	 */
	function submit(value: string) {
		if (resolvePrompt) {
			resolvePrompt(value);
			resolvePrompt = null;
		}
		close();
	}

	/**
	 * Cancel the prompt
	 */
	function cancel() {
		if (resolvePrompt) {
			resolvePrompt(null);
			resolvePrompt = null;
		}
		close();
	}

	return {
		setNavTrigger(navTriggerRef: InstanceType<typeof NavTrigger> | null) {
			navTrigger.value = navTriggerRef;
		},
		title,
		message,
		placeholder,
		defaultValue,
		isMobile,
		checkMobileScreen,
		prompt,
		submit,
		cancel,
	};
});

// Public store for requesting prompts
export const usePrompt = defineStore('prompt', () => {
	return {
		prompt: usePrivatePrompt().prompt,
	};
});


// Inner component for the prompt form content
const PromptForm = defineComponent({
	name: 'PromptForm',
	components: {
		Button,
		InputText,
	},
	setup() {
		const store = usePrivatePrompt();
		const inputValue = ref(store.defaultValue);

		watch(
			() => store.defaultValue,
			(newVal) => {
				inputValue.value = newVal;
			}
		);

		function handleSubmit() {
			store.submit(inputValue.value);
		}

		function handleCancel() {
			store.cancel();
		}

		// Handle Enter key to submit
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === 'Enter' && !event.shiftKey) {
				event.preventDefault();
				handleSubmit();
			} else if (event.key === 'Escape') {
				handleCancel();
			}
		}

		

		return {
			inputValue,
			handleSubmit,
			handleCancel,
			onKeyDown,
			store,
		};
	},
	template: `
    <div class="prompt-content">
      <p v-if="store.message" class="prompt-message">{{ store.message }}</p>

      <div class="p-input-filled w-full my-2">
        <InputText
          v-model="inputValue"
          :placeholder="store.placeholder"
          class="w-full"
          autofocus
          @keydown="onKeyDown"
        />
      </div>
    </div>
    
    <div class="flex justify-content-end gap-2">
      <Button
        label="Cancel"
        class="p-button-text"
        @click="handleCancel"
      />
      <Button
        label="Submit"
        @click="handleSubmit"
      />
    </div>
  `,
});

// Define the component using Options API
export default {
	name: 'PromptModal',
	components: {
		Dialog,
		Drawer,
		PromptForm,
		NavTrigger,
	},
	setup() {
		// Use the store in the component
		const store = usePrivatePrompt();
		const navTriggerRef = ref<InstanceType<typeof NavTrigger> | null>(null);

		// Set up the window resize event listener
		onMounted(() => {
			store.setNavTrigger(navTriggerRef.value);
		});

		return {
			store,
			navTriggerRef,
		};
	},
};
</script>

<template>
	<NavTrigger ref="navTriggerRef" triggerKey="prompt-modal">
		<template #default="{ show }">
			<template>
				<!-- Dialog for desktop view -->
				<Dialog
					v-if="!store.isMobile"
					:visible="show"
					:header="store.title"
					:modal="true"
				>
					<PromptForm />
					<template #closebutton><div></div></template>
				</Dialog>

				<!-- Drawer for mobile view -->
				<Drawer
					v-else
					:visible="show"
					:header="store.title"
					position="bottom"
					:style="{ height: 'auto', maxHeight: '80vh' }"
				>
					<PromptForm />
					<template #closebutton><div></div></template>
				</Drawer>
			</template>
		</template>
	</NavTrigger>
</template>

<style scoped lang="scss">
</style>
