<script setup lang="ts">
import { computed, reactive, toRefs } from 'vue';
import Icon from './Icon.vue';

const _props = defineProps<{
	amount: number | string;
	mode?: 'none' | 'balance' | 'balance_reverse' | 'net_change' | 'transaction';
	hideCurrency?: boolean;
	round?: boolean;
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
		signDisplay = 'never';
	}
	if (props.mode === 'transaction') {
		signDisplay = numAmount.value > 0 ? 'always' : 'never';
	}

	const formatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		signDisplay,
		maximumFractionDigits: props.round ? 0 : 2,
	});

	let val = formatter.format(Number(numAmount.value));

	if (props.hideCurrency) {
		val = val.replaceAll(/[^+-\d.,]/g, '');
	}

	return val;
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
	<span class="currency inline-flex align-items-center" :style="{ color }">
		<Icon
			v-if="mode === 'net_change' && numAmount !== 0"
			:name="`material-symbols::arrow_${numAmount > 0 ? 'upward' : 'downward'}`"
		/>
		{{ formatted }}
	</span>
</template>

<style scoped></style>
