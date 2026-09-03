<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useBudgetStore } from '@/stores/budget.store';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import type { Budget } from 'delfi-core/models/Budget';
import BudgetUtils, { BudgetDisplayShapes } from 'delfi-core/models/Budget';
import NavTriggerDrawer from '../utils/NavTrigger/NavTriggerDrawer.vue';
import { jsonCopy } from 'delfi-core/utils/miscUtils.js';
import EditVariantForm from './EditVariantForm.vue';
import Message from 'primevue/message';
import { ddate } from 'delfi-core/utils/dateUtils.js';
import CategoryButton from '../CategoryButton.vue';
import AccountButton from '../AccountButton.vue';
import BudgetVariantsDrawer from './BudgetVariantsDrawer.vue';

const { budget, ...props} = defineProps<{
	budget: Budget | null,
	onClose?: () => void;
}>();

// const budget = ref<Budget | null>(null);
const navTrigger = ref<InstanceType<typeof NavTriggerDrawer>>();

defineExpose({
	// open: (_budget: Budget) => {
	// 	budget.value = _budget;
	// 	resetDraft();
	// 	navTrigger.value?.trigger()?.open();
	// },
});
const emit = defineEmits<{
	'update:visible': [visible: boolean];
}>();

const budgetStore = useBudgetStore();
const activeTab = ref<'Overview' | 'Schedule' | 'Child Items'>('Overview');

const draft = ref<Budget | null>();
function resetDraft() {
	draft.value = jsonCopy(budget);
}

const isNew = computed(() => !draft.value?.budget_id);

onMounted(() => {
	if (!budget) {
		return;
	}
	resetDraft();
	navTrigger?.value?.trigger()?.open();
})

// Select the current, next, or last variant for main display
const mainVariant = computed(() => {
	if (!draft.value) return null;
	return BudgetUtils.getMostCurrentVariant(draft.value.scheduleVariants);
});

const budgetTypeOptions = Object.values(BudgetDisplayShapes);

const isSaving = ref(false);


async function save() {
	if (!draft.value || isSaving.value) return;
	isSaving.value = true;
	try {
		await budgetStore.upsertBudget(draft.value);
		close();
	} catch (err) {
		console.error('Failed to save budget:', err);
	} finally {
		isSaving.value = false;
	}
}

function close() {
	navTrigger.value?.trigger()?.close();
	emit('update:visible', false);
	props.onClose?.();
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

const clickedAddNote = ref(false);
const showNoteField = computed(() => draft.value?.notes || clickedAddNote.value);

const variantsDrawer = ref<InstanceType<typeof BudgetVariantsDrawer>>();
function openVariantsDrawer() {
	variantsDrawer.value?.open();
}

const displayConfig = computed(() => BudgetDisplayShapes[draft.value?.displayShape || '']);
const accountsAsTransfer = computed(() => displayConfig.value?.asTransfer);

</script>

<template>
	<NavTriggerDrawer
		ref="navTrigger"
		triggerKey="upsertBudget"
			@close="onClose"
	>
			<template #header>
				<h2>{{ isNew ? 'New' : 'Edit' }} {{ draft?.displayShape?.toLowerCase() }} budget</h2>
			</template>
			<div class="flex flex-column gap-4" v-if="draft && mainVariant">
				<!-- Memo -->
				<div>
					<label for="budget-memo">Name</label>
					<InputText
						id="budget-memo"
						v-model="draft.memo"
						class="w-full"
						placeholder="e.g. Monthly Groceries"
					/>
				</div>

				<div v-if="accountsAsTransfer" class="flex align-items-end gap-3">
					<div>
						<label class="text-small">FROM</label>
						<AccountButton v-model="draft.origin_account_id" />
					</div>
					<i class="pi pi-arrow-right text-lg h-2rem"></i>
					<div>
						<label class="text-small">TO</label>
						<AccountButton v-model="draft.account_id" />
					</div>
				</div>

				<div class="flex-column align-items-start gap-2">
					<AccountButton v-if="!accountsAsTransfer" v-model="draft.account_id" />
					<CategoryButton v-model="draft.category_id" :typeFilter="displayConfig?.categoryType" />
				</div>

				<div v-if="mainVariant">
					<EditVariantForm :key="mainVariant.schedule_variant_id" v-model="mainVariant" />
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
				<div v-if="showNoteField">
					<label for="budget-notes" >NOTE</label>
					<Textarea
						id="budget-notes"
						v-model="draft.notes"
						class="w-full"
						rows="3"
						placeholder="Optional notes about this budget…"
					/>
				</div>
				<div class="flex-row-center">
					<Button v-if="!showNoteField" text icon="pi pi-pencil" label="Add note" @click="clickedAddNote = true" />
					<div class="flex-1" />
					<Button text icon="pi pi-history" label="All versions" @click="openVariantsDrawer" />
				</div>

				<BudgetVariantsDrawer ref="variantsDrawer" v-model="draft.scheduleVariants" />
			</div>
			
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
label {
	display: block;
	margin-bottom: .25rem;
	font-size: .8;
	text-transform: uppercase;
}
</style>
