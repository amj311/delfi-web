<script setup lang="ts">
import { computed, ref } from 'vue';
import NavTriggerDrawer from './utils/NavTrigger/NavTriggerDrawer.vue';
import { useBudgetStore } from '@/stores/budget.store';
import type { Budget } from 'delfi-core/models/Budget';
import type { AttributionEventDetails } from 'delfi-core/models/Transaction';
import BudgetSelector from './BudgetSelector.vue';

const triggerRef = ref<InstanceType<typeof NavTriggerDrawer> | null>(null);
let resolvePromise: ((budget_id: string | null) => void) | null = null;
const selectedBudgetId = ref<string>('');
const selectedEvent = ref<AttributionEventDetails | null>(null);

const emit = defineEmits<{
	newBudget: [displayShape: string, event: AttributionEventDetails];
}>();

defineExpose({
	selectBudget: (currentBudgetId?: string | null, event?: AttributionEventDetails | null) => {
		return new Promise<string | null>((resolve) => {
			resolvePromise = resolve;
			selectedBudgetId.value = currentBudgetId || '';
			selectedEvent.value = event || null;
			triggerRef.value?.trigger()?.open();
		});
	}
});

function selectBudgetId({ budgetId }) {
	selectedBudgetId.value = budgetId || '';
	if (resolvePromise) {
		resolvePromise(budgetId || null);
		resolvePromise = null;
	}
	triggerRef.value?.trigger()?.close();
}

function cancelSelection() {
	if (resolvePromise) {
		resolvePromise(selectedBudgetId.value || null);
		resolvePromise = null;
	}
}

function handleNewBudget(displayShape: string, event: AttributionEventDetails) {
	if (resolvePromise) {
		resolvePromise(null);
		resolvePromise = null;
	}
	triggerRef.value?.trigger()?.close();
	emit('newBudget', displayShape, event);
}

</script>

<template>
	<NavTriggerDrawer ref="triggerRef" triggerKey="select-budget" title="Select Budget" @close="cancelSelection" :width="25">
		<BudgetSelector
			:currentBudgetId="selectedBudgetId || null"
			:transaction="selectedEvent"
			@select="selectBudgetId"
			@newBudget="handleNewBudget"
		/>
	</NavTriggerDrawer>
</template>

<style scoped lang="scss">
</style>
