<!-- Easy user flow for selection which budget, category, etc a transaction belongs to -->
<script setup lang="ts">
import { computed, ref } from 'vue';
import Button from 'primevue/button';
import { useBudgetStore } from '@/stores/budget.store';
import BudgetSelector from './BudgetSelector.vue';
import type { Budget, BudgetChildItem } from 'delfi-core/models/Budget';
import type { Category } from 'delfi-core/models/Category';
import type { AttributionEvent, BudgetGroup, Transaction } from 'delfi-core/models/Transaction';
import CategorySelector from './CategorySelector.vue';
import { useCategoryStore } from '@/stores/category.store';
import GroupSelector from './GroupSelector.vue';
import { useGroupStore } from '@/stores/group.store';
import NavTriggerDrawer from './utils/NavTrigger/NavTriggerDrawer.vue';
import Icon from './Icon.vue';

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
type SetMap<T, K extends keyof T> = { [P in K]: Set<T[P]>; };

const allOriginal = ref<Array<Selection>>([]);

const SelectionIdAttributes = ['budget_id', 'budget_child_item_id', 'category_id', 'group_id'] as const;
const valueSets = computed(() => {
	return SelectionIdAttributes.reduce((all, a) => {
		all[a] = new Set(allOriginal.value.map(s => s[a]));
		return all;
	}, {} as SetMap<Selection, typeof SelectionIdAttributes[number]>)
})

const eventForBudget = ref<AttributionEvent | null>(null);

function getCommonValue<T extends typeof SelectionIdAttributes[number]>(attribute: T) {
	const set = valueSets.value[attribute];
	return set?.size === 1 ? set.values().next().value : undefined;
}

/**
 * UNDEFINED indicates that original values should be maintained, not overwritten with null/undefined!!!
 */
const currentSelection = ref<Selection>({
	budget_id: undefined,
	Budget: undefined,
	budget_child_item_id: undefined,
	BudgetChildItem: undefined,
	category_id: undefined,
	Category: undefined,
	group_id: undefined,
	Group: undefined,
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
	/**
	 * Waits for the user to make selections.
	 * Returns an array of selections
	 * @param current 
	 * @param activeStep 
	 */
	waitForSelection<T extends Selection>(current: T | Array<T>, activeStep?: Step, fromEvent?: AttributionEvent) {
		eventForBudget.value = fromEvent || null;

		// copy items to avoid mutation
		const items = Array.isArray(current) ? current : [current];
		allOriginal.value = items.map(i => ({
			budget_id: i.budget_id,
			Budget: i.Budget,
			budget_child_item_id: i.budget_child_item_id,
			BudgetChildItem: i.BudgetChildItem,
			category_id: i.category_id,
			Category: i.Category,
			group_id: i.group_id,
			Group: i.Group,
		}));

		// reset the current selection
		const commonBudgetId = getCommonValue('budget_id');
		currentSelection.value.budget_id = commonBudgetId;
		currentSelection.value.Budget = commonBudgetId ? allOriginal.value[0].Budget : undefined; // expect this to be common value

		const common_budget_child_item_id = getCommonValue('budget_child_item_id');
		currentSelection.value.budget_child_item_id = common_budget_child_item_id;
		currentSelection.value.BudgetChildItem = common_budget_child_item_id ? allOriginal.value[0].BudgetChildItem : undefined;

		const common_category_id = getCommonValue('category_id');
		currentSelection.value.category_id = common_category_id;
		currentSelection.value.Category = common_category_id ? allOriginal.value[0].Category : undefined;

		const common_group_id = getCommonValue('group_id');
		currentSelection.value.group_id = common_group_id;
		currentSelection.value.Group = common_group_id ? allOriginal.value[0].Group : undefined;

		currentStep.value = activeStep || 'Budget';

		drawerTrigger.value?.trigger()?.open();

		return new Promise<Selection | null>((resolve, reject) => {
			promiseResolver.value = resolve as any;
			promiseRejector.value = reject;
		});
	},
	close: drawerTrigger.value?.trigger()?.close,
});

function onBudgetSelected(budget_id: string | null, budget_child_item_id: string | null) {
	// assign budget attributes if available, other wise keep original.
	// Use child attributes first if available
	const budget = useBudgetStore().getBudgetById(budget_id);
	const childItem = budget?.childItems?.find((item) => item.budget_child_item_id === budget_child_item_id);
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

	// If there is only one category option, continue to Group
	// If budget has no category, or is a parent category, allow selection
	if (currentSelection.value.Budget?.Category?.ParentCategory) {
		currentStep.value = 'Group';
	}
	else {
		currentStep.value = 'Category';
	}
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
		const budgetCategory = useCategoryStore().getCategoryById(
			currentSelection.value.BudgetChildItem?.category_id || currentSelection.value.Budget?.category_id
		);
		if (budgetCategory) {
			return [budgetCategory, ...(budgetCategory.Children || [])];
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
	<NavTriggerDrawer ref="drawerTrigger" :triggerKey="'transaction-attribution'" :width="25">
		<div class="flex flex-column gap-1 h-full overflow-hidden">
			<div class="step-label" :class="{ current: currentStep === 'Budget' }" @click="currentStep = 'Budget'">
				<i class="pi pi-wallet" />
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

			<div class="selector-frame" :class="{ current: currentStep === 'Budget' }">
				<BudgetSelector
					v-if="currentStep === 'Budget'"
					:currentBudgetId="currentSelection.budget_id"
					:currentChildItemId="currentSelection.budget_child_item_id"
					:attribution="eventForBudget"
					@select="(selection) => onBudgetSelected(selection.budgetId, selection.childItemId)"
				/>
			</div>

			<div class="step-label" :class="{ current: currentStep === 'Category' }" @click="currentStep = 'Category'">
				<Icon name="category" />
				<span>Category: </span>

				<div class="flex-grow-1 w-full min-w-0 text-ellipsis">
					<template v-if="!currentSelection.Category">Uncategorized</template>
					<template v-else>{{ currentSelection.Category.name }}</template>
				</div>

				<i class="pi pi-angle-right" v-if="currentStep !== 'Category'" />
				<i class="pi pi-angle-down" v-else />
			</div>

			<div class="selector-frame" :class="{ current: currentStep === 'Category' }">
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

			<div class="step-label" :class="{ current: currentStep === 'Group' }" @click="currentStep = 'Group'">
				<Icon name="tag" />
				<span>Group: </span>
				<div class="flex-grow-1 text-ellipsis">
					<template v-if="!currentSelection.Group">No group</template>
					<template v-else>{{ currentSelection.Group.name }}</template>
				</div>
				<i class="pi pi-angle-right" v-if="currentStep !== 'Group'" />
				<i class="pi pi-angle-down" v-else />
			</div>

			<div class="selector-frame" :class="{ current: currentStep === 'Group' }">
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
				<Button label="Cancel" size="large" text severity="secondary" @click="cancel" />
				<Button label="Save" size="large" @click="submit" />
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

	&.current {
		font-weight: bold;
	}
}

.selector-frame {
	display: flex;
	flex-direction: column;
	margin-left: 0.5rem;
	max-height: 0px;
	overflow-y: auto;
	flex-grow: 1;
	transition: max-height 0.3s ease-in-out;

	&.current {
		max-height: 100vh;
	}
}
</style>
