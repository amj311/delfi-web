<script setup lang="ts">
import { computed, reactive, toRefs } from 'vue';

const _props = defineProps<{
	amount: number,
	mode?: 'balance' | 'balance_reverse' | 'net_change' | 'transaction',
}>();
const props = reactive(_props);

const formatted = computed(() => {

	let signDisplay: any = 'auto';
	if (props.mode === 'balance') {
		signDisplay = props.amount < 0 ? 'always' : 'never';
	}
	if (props.mode === 'balance_reverse') {
		signDisplay = props.amount > 0 ? 'always' : 'never';
	}
	if (props.mode === 'net_change') {
		signDisplay = 'exceptZero';
	}
	if (props.mode === 'transaction') {
		signDisplay = props.amount > 0 ? 'always' : 'never';
	}

	const formatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		signDisplay,
	});

	return formatter.format(Number(props.amount))
});
const color = computed(() => {
	if (props.mode === 'balance' && props.amount < 0) {
		return 'red';
	}
	if (props.mode === 'balance_reverse' && props.amount > 0) {
		return 'limegreen';
	}
	if (props.mode === 'transaction' && props.amount > 0) {
		return 'limegreen';
	}
});

</script>

<template>
  <span class="currency" :style="{color}">{{ formatted }}</span>
</template>

<style scoped>
</style>
