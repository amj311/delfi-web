<script setup lang="ts">
import { computed, ref } from 'vue';
import Drawer from 'primevue/drawer';
import NavTrigger from './utils/NavTrigger.vue';
import Button from 'primevue/button';
import { useBudgetStore } from '@/stores/budget.store';

const drawerTrigger = ref<InstanceType<typeof NavTrigger> | null>(null);

const currentBudgetId = ref<string | null>(null);

const promiseResolver = ref<((value: string | null) => void) | null>(null);
const promiseRejector = ref<((reason?: any) => void) | null>(null);

function closeDrawer() {
	if (drawerTrigger.value) {
		drawerTrigger.value.close();
	}
	if (promiseResolver.value) {
		promiseResolver.value(currentBudgetId.value);
	}
}

function selectBudget(budgetId: string | null) {
	currentBudgetId.value = budgetId;
	closeDrawer();
}

defineExpose({
	waitForSelection(_currentBudgetId: string | null = null) {
		drawerTrigger.value?.open();
		currentBudgetId.value = _currentBudgetId;

		return new Promise<string | null>((resolve) => {
			promiseResolver.value = resolve;
			promiseRejector.value = () => {
				resolve(null);
			};
		});
	},
	close: drawerTrigger.value?.close,
});

const budgets = useBudgetStore().budgets;

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
						@click="closeDrawer"
						severity="secondary"
					/>
				</template>
				
				<div class="flex flex-column">
					<div
						v-for="budget in budgets"
						:key="budget.budget_id"
						class="flex align-items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 border-round"
						@click="selectBudget(budget.budget_id)"
					>
						<div class="flex-grow-1">{{  budget.memo }}</div>
					</div>
				</div>

			</Drawer>
		</template>
	</NavTrigger>
</template>

<style scoped lang="scss">
</style>
