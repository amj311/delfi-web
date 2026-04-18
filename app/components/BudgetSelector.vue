<script setup lang="ts">
import { computed, ref } from 'vue';
import Drawer from 'primevue/drawer';
import NavTrigger from './utils/NavTrigger/NavTrigger.vue';
import Button from 'primevue/button';
import { useBudgetStore } from '@/stores/budget.store';
import AttributionAvatar from './AttributionAvatar.vue';

const props = defineProps<{
	currentBudgetId?: string | null;
	currentChildItemId?: string | null;
}>();

type Selection = {
	budgetId: string | null;
	childItemId: string | null;
};

const emit = defineEmits<{
	select: [Selection];
}>();

const currentSelection = ref<Selection>({
	budgetId: props.currentBudgetId || null,
	childItemId: props.currentChildItemId || null,
});

const selectedBudget = computed(() => {
	return useBudgetStore().getBudgetById(currentSelection.value.budgetId);
});
const showChildItemsSelection = ref(false);

function emitSelection() {
	emit('select', currentSelection.value);
}

function selectBudget(budgetId: string | null) {
	currentSelection.value.budgetId = budgetId;
	const selectedBudget = useBudgetStore().getBudgetById(budgetId);
	if (selectedBudget && selectedBudget.childItems?.length) {
		showChildItemsSelection.value = true;
	} else {
		emitSelection();
	}
}

function selectChildItem(childItemId: string | null) {
	currentSelection.value.childItemId = childItemId;
	emitSelection();
	showChildItemsSelection.value = false;
}

const budgets = useBudgetStore().orderedBudgets;
</script>

<template>
	<div class="flex flex-column h-full" v-if="!showChildItemsSelection">
		<div class="flex align-items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 border-round" @click="selectBudget(null)">
			<AttributionAvatar :icon="'question-circle'" color="gray1" :size="2" />
			<div class="flex-grow-1">No Budget</div>
		</div>

		<div class="flex-grow-1 overflow-y-auto">
			<template
				v-for="budget, i in budgets"
				:key="budget.budget_id"
			>
				<h4 v-if="budget.Category?.ParentCategory?.name !== budgets[i - 1]?.Category?.ParentCategory?.name" class="my-3 category-header">{{ budget.Category?.ParentCategory?.name || 'Uncategorized' }}</h4>
				<div
					class="flex align-items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 border-round"
					@click="selectBudget(budget.budget_id)"
				>
					<AttributionAvatar :category="budget.Category" :size="2" />
					<div class="flex-grow-1">{{ budget.memo }}</div>
					<i class="pi pi-check" v-if="currentBudgetId === budget.budget_id" />
				</div>
			</template>
		</div>
	</div>

	<div v-else class="flex flex-column">
		<div class="flex align-items-center gap-2">
			<h4 class="p-2">Select a Child Item</h4>
			<div class="flex-grow-1"></div>
			<Button text @click="selectChildItem(null)">
				Skip
				<i class="pi pi-angle-right" />
			</Button>
		</div>
		<div
			v-for="childItem in selectedBudget?.childItems || []"
			:key="childItem.budget_child_item_id"
			class="flex align-items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 border-round"
			@click="selectChildItem(childItem.budget_child_item_id)"
		>
			<div class="flex-grow-1">{{ childItem.memo }}</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
.category-header {
	position: sticky;
	top: 0;
	z-index: 1;
	background: #fff;
	padding: .25rem 0;
}
</style>
