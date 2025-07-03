<script setup lang="ts">
import { computed, ref } from 'vue';
import Drawer from 'primevue/drawer';
import NavTrigger from './utils/NavTrigger.vue';
import Button from 'primevue/button';
import { useBudgetStore } from '@/stores/budget.store';
import BudgetSelector from './BudgetSelector.vue';

const drawerTrigger = ref<InstanceType<typeof NavTrigger> | null>(null);

type Selection = {
	budgetId: string | null;
	childItemId: string | null;
};

const currentSelection = ref<Selection>({
	budgetId: null,
	childItemId: null,
});

const promiseResolver = ref<((value: Selection | null) => void) | null>(null);
const promiseRejector = ref<((reason?: any) => void) | null>(null);

function onSelection(selection: Selection) {
	currentSelection.value = selection;
	if (drawerTrigger.value) {
		drawerTrigger.value.close();
	}
	if (promiseResolver.value) {
		promiseResolver.value(selection);
	}
}

defineExpose({
	waitForSelection(_currentBudgetId: string | null = null, _currentChildItemId: string | null = null) {
		currentSelection.value.budgetId = _currentBudgetId;
		currentSelection.value.childItemId = _currentChildItemId;

		drawerTrigger.value?.open();

		return new Promise<Selection | null>((resolve, reject) => {
			promiseResolver.value = resolve;
			promiseRejector.value = reject;
		});
	},
	close: drawerTrigger.value?.close,
});

</script>

<template>
	<NavTrigger
		ref="drawerTrigger"
		:triggerKey="'budget-select'"
	>
		<template #default="{ show }">
			<Drawer
				:visible="show"
				position="right"
				header="Select a Budget"
				class="w-full sm:w-25rem"
			>
				<template #closebutton>
					<Button
						icon="pi pi-times"
						size="small"
						text
						@click="() => onSelection(currentSelection)"
						severity="secondary"
					/>
				</template>
				
				<BudgetSelector
					:currentBudgetId="currentSelection.budgetId"
					:currentChildItemId="currentSelection.childItemId"
					@select="onSelection"
				/>
			</Drawer>
		</template>
	</NavTrigger>
</template>

<style scoped lang="scss">
</style>
