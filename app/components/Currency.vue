<script setup lang="ts">
import { computed, reactive, toRefs } from 'vue';

const _props = defineProps<{
	amount: number | string,
	mode?: 'balance' | 'balance_reverse' | 'net_change' | 'transaction',
	hideCurrency?: boolean
}>();
const props = reactive(_props);
const numAmount = computed(() => {
	if (typeof props.amount === 'string') {
		return parseFloat(props.amount);
	}
	return props.amount;
});

const formatted = computed(() => {

	let signDisplay: any = 'never';
	if (props.mode === 'balance') {
		signDisplay = numAmount.value < 0 ? 'always' : 'never';
	}
	if (props.mode === 'balance_reverse') {
		signDisplay = numAmount.value > 0 ? 'always' : 'never';
	}
	if (props.mode === 'net_change') {
		signDisplay = 'exceptZero';
	}
	if (props.mode === 'transaction') {
		signDisplay = numAmount.value > 0 ? 'always' : 'never';
	}

	const formatter = new Intl.NumberFormat('en-US', {
		style: props.hideCurrency ? 'decimal' : 'currency',
		currency: 'USD',
		signDisplay,
	});

	return formatter.format(Number(numAmount.value))
});
const color = computed(() => {
	if (props.mode === 'balance' && numAmount.value < 0) {
		return '#c72850';
	}
	if (props.mode === 'balance_reverse' && numAmount.value > 0) {
		return '#4ccd8d';
	}
	if (props.mode === 'transaction' && numAmount.value > 0) {
		return '#4ccd8d';
	}
});

</script>

<template>
  <span class="currency" :style="{color}">{{ formatted }}</span>
</template>

<style scoped>
</style>
