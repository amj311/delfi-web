<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useBudgetStore } from '@/stores/budget.store';
import Drawer from 'primevue/drawer';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';
import type { Budget } from 'delfi-core/models/Budget';
import type { BudgetAmountTemplate } from 'delfi-core/models/Budget';
import { BudgetDisplayShapes } from 'delfi-core/models/Budget';
import NavTriggerDrawer from './utils/NavTrigger/NavTriggerDrawer.vue';
import { jsonCopy } from 'delfi-core/utils/miscUtils.js';
import InputCurrency from './InputCurrency.vue';
import EditVariantForm from './EditVariantForm.vue';
import Message from 'primevue/message';

const props = defineProps<{
	isNew?: boolean;
	onClose?: () => void;
}>();

const budget = ref<Budget | null>(null);
const navTrigger = ref<InstanceType<typeof NavTriggerDrawer>>();

defineExpose({
	open: (_budget: Budget) => {
		budget.value = _budget;
		resetDraft();
		navTrigger.value?.trigger()?.open();
	},
});
const emit = defineEmits<{
	'update:visible': [visible: boolean];
}>();

const budgetStore = useBudgetStore();
const activeTab = ref<'Overview' | 'Schedule' | 'Child Items'>('Overview');

const draft = ref<Budget | null>();
function resetDraft() {
	draft.value = jsonCopy(budget.value);
}

// for now. imagine separate component for future variants ui
const variant = computed(() => draft.value?.scheduleVariants[0] || null);

const isSaving = ref(false);

const budgetTypeOptions = Object.values(BudgetDisplayShapes);

const frequencyOptions = [
	{ label: 'Daily', value: 'DAILY' },
	{ label: 'Weekly', value: 'WEEKLY' },
	{ label: 'Monthly', value: 'MONTHLY' },
	{ label: 'Yearly', value: 'YEARLY' },
];

const amountTypeOptions = [
	{ label: 'Fixed', value: 'fixed' },
	{ label: 'Triggered', value: 'triggered' },
	{ label: 'Seasonal', value: 'seasonal' },
];

const triggerOperatorOptions = [
	{ label: 'Add', value: 'add' },
	{ label: 'Subtract', value: 'subtract' },
	{ label: 'Multiply', value: 'multiply' },
	{ label: 'Divide', value: 'divide' },
];

const MONTHS = [
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December',
] as const;


function save() {
	// isSaving.value = true;
	
	// // Get the first schedule variant or create one
	// const variant = budget.value?.scheduleVariants?.[0];
	
	// const budgetData = {
	// 	...(props.isNew ? {} : { budget_id: budget.value!.budget_id }),
	// 	memo: state.memo,
	// 	notes: state.notes || null,
	// 	budgetType: BudgetDisplayShape.TRANSACTION,
	// 	recurrence_type: state.recurrenceType,
	// 	account_id: state.targetAccountId || null,
	// 	origin_account_id: state.originAccountId || null,
	// 	category_id: state.categoryId || null,
	// 	group_id: null,
	// 	onceAndDone: false,
	// 	scheduleVariants: [{
	// 		schedule_variant_id: variant.schedule_variant_id,
	// 		schedule: {
	// 			start: state.startDate,
	// 			end: state.endDate || null,
	// 			frequency: state.frequency.toLowerCase(),
	// 			interval: state.interval,
	// 		},
	// 		projectionSchedule: variant.projectionSchedule,
	// 		amountTemplate: {
	// 			type: state.amountType,
	// 			...(state.amountType === 'fixed' ? { amount: state.amount } : {}),
	// 			...(state.amountType === 'seasonal' ? { monthAmounts: { ...state.monthAmounts } } : {}),
	// 			...(state.amountType === 'triggered' ? {
	// 				trigger: {
	// 					filter: state.triggerFilter ? JSON.parse(state.triggerFilter) : {},
	// 					operator: state.triggerOperator,
	// 					operand: state.triggerOperand,
	// 				}
	// 			} : {}),
	// 		} as BudgetAmountTemplate,
	// 	}],
	// 	childItems: state.childItems.map(item => ({
	// 		...(item.id.startsWith('stub-') ? {} : { budget_child_item_id: item.id }),
	// 		memo: item.memo,
	// 		amount: item.amount,
	// 		date: item.date,
	// 		transaction_type: 'OUTFLOW' as const,
	// 		accounts: [],
	// 		category_id: null,
	// 		group_id: null,
	// 	})),
	// };
	
	// budgetStore.upsertBudget(budgetData as any).then(() => {
	// 	close();
	// }).catch(err => {
	// 	console.error('Failed to save budget:', err);
	// }).finally(() => {
	// 	isSaving.value = false;
	// });
}

function addChildItem() {
	// state.childItems.push({
	// 	id: `stub-${Date.now()}`,
	// 	memo: 'New child item',
	// 	amount: 0,
	// 	date: new Date().toISOString().split('T')[0],
	// });
}

function removeChildItem(id: string) {
	// state.childItems = state.childItems.filter((item) => item.id !== id);
}

const totalChildAmount = computed(() => {
	// state.childItems.reduce((sum, item) => sum + item.amount, 0)
});

const remainingAmount = computed(() => {
	// if (state.amountType !== 'fixed') return null;
	// return state.amount - totalChildAmount.value;
});
</script>

<template>
	<NavTriggerDrawer
		ref="navTrigger"
		triggerKey="upsertBudget"
	>
		<div class="flex flex-column gap-4" v-if="draft && variant">
			<Message severity="warn">Work in progress! Does not save anything</Message>
	
			<!-- Memo -->
			<div>
				<label for="budget-memo" class="block font-bold mb-1">Name</label>
				<InputText
					id="budget-memo"
					v-model="draft.memo"
					class="w-full"
					placeholder="e.g. Monthly Groceries"
				/>
			</div>

			<div v-if="variant">
				<EditVariantForm v-model="variant" />
			</div>

			<!-- Child items summary -->
			<!-- <div v-if="variant.amountType === 'fixed'" class="p-3 border-round bg-surface-50">
				<div class="flex justify-content-between align-items-center mb-2">
					<span class="font-bold">Child Items</span>
					<Button
						label="+ Add"
						icon="pi pi-plus"
						severity="secondary"
						outlined
						size="small"
						@click="addChildItem"
					/>
				</div>
				<div v-if="variant.childItems.length === 0" class="text-sm text-surface-500">
					No child items yet.
				</div>
				<div v-else class="flex flex-column gap-2">
					<div
						v-for="item in variant.childItems"
						:key="item.id"
						class="flex align-items-center gap-2 p-2 border-round bg-surface-0"
					>
						<span class="flex-grow-1 text-sm">{{ item.memo }}</span>
						<span class="text-sm">${{ item.amount }}</span>
						<Button
							icon="pi pi-trash"
							severity="danger"
							text
							size="small"
							@click="removeChildItem(item.id)"
						/>
					</div>
				</div>
				<div class="mt-3 pt-3 border-top-1 surface-border flex justify-content-between text-sm">
					<span class="font-bold">Total allocated</span>
					<span class="font-bold">${{ totalChildAmount }}</span>
				</div>
				<div v-if="remainingAmount !== null" class="mt-1 text-right text-sm">
					<span :class="remainingAmount >= 0 ? 'text-green-600' : 'text-red-600'">
						{{ remainingAmount >= 0 ? 'Remaining' : 'Over by $'}}{{ Math.abs(remainingAmount) }}
					</span>
				</div>
			</div> -->

			<!-- Notes -->
			<div>
				<label for="budget-notes" class="block font-bold mb-1">Notes</label>
				<Textarea
					id="budget-notes"
					v-model="draft.notes"
					class="w-full"
					rows="3"
					placeholder="Optional notes about this budget…"
				/>
			</div>
		</div>
			
		<!-- ======================== -->
		<!-- TAB 2: SCHEDULE (stub)   -->
		<!-- ======================== -->
		<!-- <div v-if="activeTab === 'Schedule'" class="flex flex-column gap-4">
			<div>
				<label for="start-date" class="block font-bold mb-1">Start Date</label>
				<InputText id="start-date" v-model="state.startDate" type="date" class="w-full" />
			</div>
			<div>
				<label for="end-date" class="block font-bold mb-1">End Date (optional)</label>
				<InputText id="end-date" v-model="state.endDate" type="date" class="w-full" />
			</div>
			<div>
				<label for="frequency" class="block font-bold mb-1">Frequency</label>
				<Select id="frequency" v-model="state.frequency" :options="frequencyOptions" class="w-full" />
			</div>
			<div>
				<label for="interval" class="block font-bold mb-1">Every</label>
				<InputNumber id="interval" v-model="state.interval" :min="1" :step="1" class="w-full" />
			</div>
		</div> -->

		<!-- ======================== -->
		<!-- TAB 3: CHILD ITEMS (stub)-->
		<!-- ======================== -->
		<!-- <div v-if="activeTab === 'Child Items'" class="flex flex-column gap-4">
			<div class="flex justify-content-between align-items-center">
				<span class="font-bold">Child Items</span>
				<Button label="+ Add" icon="pi pi-plus" severity="secondary" outlined @click="addChildItem" />
			</div>
			<div v-for="item in state.childItems" :key="item.id" class="p-3 border-round bg-surface-50">
				<div class="flex flex-column gap-2">
					<InputText v-model="item.memo" placeholder="Item name" class="w-full" />
					<div class="grid grid-nogap gap-2">
						<div class="col-6">
							<label class="block text-xs mb-1">Amount</label>
							<InputNumber v-model="item.amount" :min="0" mode="currency" currency="USD" class="w-full" />
						</div>
						<div class="col-6">
							<label class="block text-xs mb-1">Date</label>
							<InputText v-model="item.date" type="date" class="w-full" />
						</div>
					</div>
					<div class="flex justify-end">
						<Button icon="pi pi-trash" severity="danger" text size="small" @click="removeChildItem(item.id)" />
					</div>
				</div>
			</div>
		</div> -->

		<!-- Footer actions -->
		<template #footer>
			<div class="flex justify-content-between w-full">
				<Button label="Discard" severity="secondary" outlined @click="() => navTrigger?.trigger()?.close()" />
				<div class="flex-grow-1" />
				<Button label="Save" :loading="isSaving" @click="save" />
			</div>
		</template>
	</NavTriggerDrawer>
</template>

<style scoped lang="scss">
/* PrimeVue Drawer overrides if needed */
</style>
