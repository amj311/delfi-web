<script setup lang="ts">
import { computed, onMounted, reactive, ref, toRefs } from 'vue';
import Icon from './Icon.vue';
import { parseNumber } from 'delfi-core/utils/miscUtils';
import InputNumber from 'primevue/inputnumber';

// currently represented as dollars. consider migrating to cents and currency code in the future
const value = defineModel<number>();

/**
 * string representation of cents for input behavior.
 * $1,000.00 => 100000
 */ 
const draftCents = ref(String((value.value || 0) * 100));
const draftDollars = computed(() => Number(draftCents.value) / 100);
const input = ref<HTMLInputElement>();

const props = defineProps<{
	inputId?: string,
}>();

const formatted = computed(() => {
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

	let val = formatter.format(Number(draftDollars.value));

	// if (props.hideCurrency) {
	// 	val = val.replaceAll(/[^+-\d.,]/g, '');
	// }

	return val;
});

onMounted(() => {
	if (input.value) {
		input.value.value = formatted.value;
	}
})

function interceptInput(e) {
	if (!input.value || !e.target) return;
	draftCents.value = (e.target.value || '0').replaceAll(/[^\d]/g, '');
	input.value.value = formatted.value;
	value.value = Number(draftCents.value) / 100;
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
	<div class="p-inputnumber p-component p-inputwrapper p-inputwrapper-filled">
		<input
			:id="inputId"
			class="p-inputtext p-component p-filled p-inputnumber-input text-right"
			ref="input"
			inputmode="numeric"
			pattern="\d*"
			@input="interceptInput"
		/>
	</div>
</template>

<style scoped></style>
