<script setup lang="ts">
import Button from 'primevue/button';
import { computed, ref, useAttrs } from 'vue';

const valueModel = defineModel<string | null | undefined>();

const props = defineProps<{
	value?: string | null;
	placeholder?: string;
}>();

const mode = computed(() => {
	return valueModel.value === undefined ? 'manual' : 'auto';
});

const firstText = valueModel.value || props.value || '';
const draft = ref<string | null | undefined>(firstText);

const isEditing = ref(false);

const showPlaceholder = computed(() => {
	return !draft.value?.trim();
});

const input = ref<HTMLInputElement>();

const emit = defineEmits<{
	input: [string | null | undefined];
	change: [string | null | undefined];
}>();

const startEditing = () => {
	isEditing.value = true;
	input.value?.focus();
};

function updateValues(newValue: string) {
	if (!newValue.trim()) {
		input.value!.innerHTML = '';
	}
	if (newValue !== draft.value) {
		draft.value = newValue.trim();
		emit('input', draft.value);
		if (mode.value === 'auto') {
			valueModel.value = draft.value;
		}
	}
}

const onInput = (event: Event) => {
	const target = event.target as HTMLElement;
	draft.value = target.innerText || '';
	updateValues(draft.value);
};
const stopEditing = (save: boolean = true) => {
	isEditing.value = false;
	input.value?.blur();
	if (save && draft.value !== firstText) {
		emit('change', draft.value);
	}
};
function cancel() {
	updateValues(firstText);
	stopEditing(false);
}
</script>

<template>
	<div class="ghost-input" :class="{ editing: isEditing }">
		<span
			class="input"
			contenteditable
			@focus="startEditing"
			@blur="stopEditing()"
			@input="onInput"
			ref="input"
			@keydown.enter="() => stopEditing()"
			:placeholder="showPlaceholder ? placeholder || 'Enter text...' : undefined"
		>
			{{ firstText }}
		</span>
		<div>
			<i class="button pi pi-undo" v-if="isEditing" @click="cancel"></i>
		</div>
	</div>
</template>

<style scoped lang="scss">
.ghost-input {
	display: inline-flex;
	align-items: center;
	gap: 0.5em;
	cursor: pointer;
	border-radius: var(--p-button-border-radius);
	font-size: var(--p-button-sm-font-size);
    padding: var(--p-button-sm-padding-y) var(--p-button-sm-padding-x);

	&:not(.editing):hover {
		background: var(--p-button-text-contrast-hover-background);
		border-color: transparent;
		color: var(--p-button-text-contrast-color);
	}

	&.editing {
		cursor: auto;

		.icon {
			opacity: 0;
			pointer-events: none;
		}
	}


	.input {
		flex-grow: 1;
		padding-left: 0.2em;
		margin-left: -0.2em;
		padding-right: 0.2em;
		margin-right: -0.2em;
		white-space: nowrap;
		outline: none;
	}

	.input::after {
		content: attr(placeholder);
		color: gray;
	}

	.placeholder {
		color: gray;
		position: absolute;
		top: 50%;
		left: 0;
		transform: translateY(-50%);
		pointer-events: none;
	}

	i.button {
		cursor: pointer;
		opacity: 0.6;
		transition: opacity 0.2s ease;

		&:hover {
			opacity: 1;
		}
	}
}
</style>
