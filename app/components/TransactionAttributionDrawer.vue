<!-- Easy user flow for selection which budget, category, etc a transaction belongs to -->
<script setup lang="ts">
import { computed, ref } from 'vue';
import Drawer from 'primevue/drawer';
import Button from 'primevue/button';
import { useBudgetStore } from '@/stores/budget.store';
import BudgetSelector from './BudgetSelector.vue';
import type { Budget, BudgetChildItem } from 'delfi-core/models/Budget';
import type { Category } from 'delfi-core/models/Category';
import type { BudgetGroup } from 'delfi-core/models/Transaction';
import CategorySelector from './CategorySelector.vue';
import { useCategoryStore } from '@/stores/category.store';
import GroupSelector from './GroupSelector.vue';
import { useGroupStore } from '@/stores/group.store';
import NavTriggerDrawer from './utils/NavTrigger/NavTriggerDrawer.vue';

const drawerTrigger = ref<InstanceType<typeof NavTriggerDrawer> | null>(null);

type Selection = {
	budget_id?: string | null;
	Budget?: Budget | null;
	budget_child_item_id?: string | null;
	BudgetChildItem?: BudgetChildItem | null;
	category_id?: string | null;
	Category?: Category | null;
	group_id?: string | null;
	Group?: BudgetGroup | null;
};

const originalSelection = ref<Selection>({
	budget_id: null,
	Budget: null,
	budget_child_item_id: null,
	BudgetChildItem: null,
	category_id: null,
	Category: null,
	group_id: null,
	Group: null,
});

const currentSelection = ref<Selection>({
	budget_id: null,
	Budget: null,
	budget_child_item_id: null,
	BudgetChildItem: null,
	category_id: null,
	Category: null,
	group_id: null,
	Group: null,
});

const promiseResolver = ref<((value: Selection | null) => void) | null>(null);
const promiseRejector = ref<((reason?: any) => void) | null>(null);

function closeAndEmit(final: Selection | null) {
	if (drawerTrigger.value) {
		drawerTrigger.value.trigger()?.close();
	}
	if (promiseResolver.value) {
		promiseResolver.value(final);
	}
}
function submit() {
	closeAndEmit(currentSelection.value);
}

function cancel() {
	closeAndEmit(null);
}

const Steps = ['Budget', 'Category', 'Group'] as const;
export type Step = (typeof Steps)[number];

const currentStep = ref<Step>('Budget');

defineExpose({
	waitForSelection(current: Selection, activeStep?: Step) {
		originalSelection.value = { ...current};

		currentSelection.value.budget_id = current.budget_id ?? null;
		currentSelection.value.Budget = current.Budget ?? null;
		currentSelection.value.budget_child_item_id = current.budget_child_item_id ?? null;
		currentSelection.value.BudgetChildItem = current.BudgetChildItem ?? null;
		currentSelection.value.category_id = current.category_id ?? null;
		currentSelection.value.Category = current.Category ?? null;
		currentSelection.value.group_id = current.group_id ?? null;
		currentSelection.value.Group = current.Group ?? null;

		currentStep.value = activeStep || 'Budget';

		drawerTrigger.value?.trigger()?.open();

		return new Promise<Selection | null>((resolve, reject) => {
			promiseResolver.value = resolve;
			promiseRejector.value = reject;
		});
	},
	close: drawerTrigger.value?.trigger()?.close,
});

function onBudgetSelected(budget_id: string | null, budget_child_item_id: string | null) {
	// assign budget attributes if available, other wise keep original.
	// Use child attributes first if available
	const budget = useBudgetStore().getBudgetById(budget_id);
	const childItem = budget?.childItems?.find(item => item.budget_child_item_id === budget_child_item_id);
	currentSelection.value.budget_id = budget_id;
	currentSelection.value.Budget = budget;
	currentSelection.value.budget_child_item_id = budget_child_item_id;
	currentSelection.value.BudgetChildItem = childItem || null;

	// copy assignments from budget. If Not available, use the attribution's values
	// use the child's attributes first
	if (childItem?.category_id || budget?.category_id) {
		currentSelection.value.category_id = childItem?.category_id || budget?.category_id;
		currentSelection.value.Category = useCategoryStore().getCategoryById(currentSelection.value.category_id);
	}
	if (childItem?.group_id || budget?.group_id) {
		currentSelection.value.group_id = childItem?.group_id || budget?.group_id;
		currentSelection.value.Group = useGroupStore().getGroupById(currentSelection.value.group_id || undefined) || null;
	}

	currentStep.value = 'Category';
}

function onCategorySelected(category_id: string | null) {
	currentSelection.value.category_id = category_id;
	currentSelection.value.Category = useCategoryStore().getCategoryById(category_id) || null;

	currentStep.value = 'Group';
}

function onGroupSelected(group_id: string | null) {
	currentSelection.value.group_id = group_id;
	currentSelection.value.Group = useGroupStore().getGroupById(group_id || undefined) || null;

	submit();
}

const allowedCategories = computed(() => {
	if (currentSelection.value.BudgetChildItem?.category_id || currentSelection.value.Budget?.category_id) {
		const budgetCategory = useCategoryStore().getCategoryById(currentSelection.value.BudgetChildItem?.category_id || currentSelection.value.Budget?.category_id);
		if (budgetCategory) {
			return [budgetCategory, ...budgetCategory.Children || []];
		}
	}
	return undefined;
});

const allowedGroups = computed(() => {
	if (currentSelection.value.BudgetChildItem?.group_id || currentSelection.value.Budget?.group_id) {
		const budgetGroup = useGroupStore().getGroupById(currentSelection.value.BudgetChildItem?.group_id || currentSelection.value.Budget?.group_id);
		if (budgetGroup) {
			return [budgetGroup];
		}
	}
	return undefined;
});

</script>

<template>
	<NavTriggerDrawer
		ref="drawerTrigger"
		:triggerKey="'transaction-attribution'"
		:width="25"
	>
		<div class="flex flex-column gap-1 h-full overflow-hidden">
			<div class="step-label" @click="currentStep = 'Budget'">
				<span>Budget: </span>

				<div class="flex-grow-1 w-full min-w-0 text-ellipsis">
					<template v-if="!currentSelection.Budget">No budget</template>
					<template v-else>
						{{ currentSelection.Budget.memo }}
						<span v-if="currentSelection.BudgetChildItem">- {{ currentSelection.BudgetChildItem.memo }}</span>
					</template>
				</div>
				<i class="pi pi-angle-right" v-if="currentStep !== 'Budget'" />
				<i class="pi pi-angle-down" v-else />
			</div>

			<div class="selector-frame" :class="{ 'current': currentStep === 'Budget' }">
				<BudgetSelector
					v-if="currentStep === 'Budget'"
					:currentBudgetId="currentSelection.budget_id"
					:currentChildItemId="currentSelection.budget_child_item_id"
					@select="(selection) => onBudgetSelected(selection.budgetId, selection.childItemId)"
				/>
			</div>

			<div class="step-label" @click="currentStep = 'Category'">
				<span>Category: </span>

				<div class="flex-grow-1 w-full min-w-0 text-ellipsis">
					<template v-if="!currentSelection.Category">Uncategorized</template>
					<template v-else>{{ currentSelection.Category.name }}</template>
				</div>

				<i class="pi pi-angle-right" v-if="currentStep !== 'Category'" />
				<i class="pi pi-angle-down" v-else />
			</div>

			<div class="selector-frame" :class="{ 'current': currentStep === 'Category' }">
				<div v-if="allowedCategories" class="flex align-items-center justify-content-center gap-2 p-2 my-2 text-sm text-gray-600">
					<i class="pi pi-info-circle" />
					Options determined by selected budget
				</div>
				<CategorySelector
					v-if="currentStep === 'Category'"
					:currentCategoryId="currentSelection.category_id || null"
					:allowedCategories="allowedCategories"
					@select="onCategorySelected"
				/>
			</div>

			<div class="step-label" @click="currentStep = 'Group'">
				<span>Group: </span>
				<div class="flex-grow-1 text-ellipsis">
					<template v-if="!currentSelection.Group">No group</template>
					<template v-else>{{ currentSelection.Group.name }}</template>
				</div>
				<i class="pi pi-angle-right" v-if="currentStep !== 'Group'" />
				<i class="pi pi-angle-down" v-else />
			</div>

			<div class="selector-frame" :class="{ 'current': currentStep === 'Group' }">
				<div v-if="allowedGroups" class="flex align-items-center justify-content-center gap-2 p-2 my-2 text-sm text-gray-600">
					<i class="pi pi-info-circle" />
					Options determined by selected budget
				</div>
				<GroupSelector
					v-if="currentStep === 'Group'"
					:currentGroupId="currentSelection.group_id || null"
					:allowedGroups="allowedGroups"
					@select="onGroupSelected"
				/>
			</div>

			<div class="flex justify-content-end gap-2">
				<Button
					label="Cancel"
					size="large"
					text
					severity="secondary"
					@click="cancel"
				/>
				<Button
					label="Save"
					size="large"
					@click="submit"
				/>

			</div>
		</div>
	</NavTriggerDrawer>
</template>

<style scoped lang="scss">
.step-label {
	display: flex;
	width: 100%;
	min-width: 0;
	cursor: pointer;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	background-color: #f5f5f5;
	border-radius: 3rem;
}

.selector-frame {
	display: flex;
	flex-direction: column;
	margin-left: .5rem;
	max-height: 0px;
	overflow-y: auto;
	flex-grow: 1;
	transition: max-height 0.3s ease-in-out;

	&.current {
		max-height: 100vh;
	}
}
</style>
