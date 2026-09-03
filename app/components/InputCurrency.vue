<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, toRefs, watch } from 'vue';
import Icon from './Icon.vue';
import { parseNumber } from 'delfi-core/utils/miscUtils';
import InputNumber from 'primevue/inputnumber';

// currently represented as dollars. TODO: consider migrating to cents and currency code in the future
const value = defineModel<number>();

	const props = defineProps<{
	inputId?: string,
}>();

const input = ref<HTMLInputElement>();

function formatted(number: number)  {
	let signDisplay: any = 'never';
	// if (props.mode === 'balance') {
	// 	signDisplay = numAmount.value < 0 ? 'always' : 'never';
	// }
	// if (props.mode === 'balance_reverse') {
	// 	signDisplay = numAmount.value > 0 ? 'always' : 'never';
	// }
	// if (props.mode === 'net_change') {
	// 	signDisplay = 'never';
	// }
	// if (props.mode === 'transaction') {
	// 	signDisplay = numAmount.value > 0 ? 'always' : 'never';
	// }

	const formatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		signDisplay,
		// maximumFractionDigits: props.round ? 0 : 2,
	});

	let val = formatter.format(value.value || 0);

	// if (props.hideCurrency) {
	// 	val = val.replaceAll(/[^+-\d.,]/g, '');
	// }

	return val;
};

const originalSign = ref(1);

onMounted(() => {
	originalSign.value = (value.value || 0) < 0 ? -1 : 1;
	updateInput();
});
watch(() => value.value, updateInput)

function updateInput() {
	if (input.value) {
		input.value.value = formatted(value.value || 0);
	}
}

function moveCursorToEnd(e) {
	if (!input.value) return;
  const end = input.value?.value.length;

  e.preventDefault();
  input.value.focus();

  // Prevent errors if the input is not focused
  if (document.activeElement === input.value) {
    input.value.setSelectionRange(end, end);
  }
}

async function interceptInput(e) {
	if (!input.value || !e.target?.value) return;

	// a value of 0 turns into $0.00, which gets appended to on input, like $0.004 instead of $0.04
	const zeroSafeValue = e.target.value.replace('$0.00', '');

	// cents always come out as absolute value. preserve the original sign
	const newCents = originalSign.value * Number((zeroSafeValue).replaceAll(/[^\d]/g, ''));
	const newDollars = newCents / 100;
	value.value = newDollars;
	await nextTick();
	input.value.value = formatted(newDollars);
}

// const color = computed(() => {
// 	if (props.mode === 'balance' && numAmount.value < 0) {
// 		return '#c72850';
// 	}
// 	if (props.mode === 'balance_reverse' && numAmount.value > 0) {
// 		return '#4ccd8d';
// 	}
// 	if (props.mode === 'transaction' && numAmount.value > 0) {
// 		return '#4ccd8d';
// 	}
// });
</script>

<template>
	<input
		:id="inputId"
		class="p-inputtext p-component p-filled p-inputnumber-input w-full text-right"
		ref="input"
		inputmode="numeric"
		pattern="\d*"
		@input="interceptInput"
		@focus="moveCursorToEnd"
		@touchstart="moveCursorToEnd"
		@click="moveCursorToEnd"
		@select="moveCursorToEnd"
	/>
</template>

<style scoped>

</style>
