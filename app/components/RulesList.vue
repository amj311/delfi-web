<script setup lang="ts">
import { useCategoryStore } from '@/stores/category.store';
import { computed, ref, watch } from 'vue';
import AttributionAvatar from '@/components/AttributionAvatar.vue';
import {
	Actions,
	TransactionRuleUtils,
	type ActionType,
	type TransactionRule,
	type TransactionRuleDraft,
} from 'delfi-core/models/TransactionRule';
import request from '@/services/request';
import FilterUtils, { type Predicate, type Property } from 'delfi-core/models/Filters';
import Button from 'primevue/button';
import DrawerModal from '@/components/utils/DrawerModal.vue';
import Icon from '@/components/Icon.vue';
import { jsonCopy } from 'delfi-core/utils/miscUtils';
import { useToast } from 'primevue/usetoast';
import FilterBuilder from '@/components/FilterBuilder.vue';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import MerchantButton from '@/components/MerchantButton.vue';
import CategoryButton from '@/components/CategoryButton.vue';
import BudgetButton from '@/components/BudgetButton.vue';
import { useBudgetStore } from '@/stores/budget.store';
import { useMerchantStore } from '@/stores/merchant.store';
import { usePrompt } from '@/components/utils/PromptModal.vue';
import type { DescriptorEntityNode } from 'delfi-core/utils/Descriptor';
import { TransactionUtils, type AttributionEvent } from 'delfi-core/models/Transaction';

const toast = useToast();
const rulesModel = defineModel<TransactionRule[]>();
const rules = ref<TransactionRule[]>(rulesModel.value || []);
watch(rules, (newVal) => {
	rulesModel.value = newVal;
});

const props = defineProps<{
	templateEvent?: AttributionEvent;
}>();

defineExpose({
	draftRule,
});

function findAction(rule: TransactionRule, actionName: string) {
	return rule.actions?.find((action) => action.action === actionName);
}

function descriptorGetter(node: DescriptorEntityNode) {
	const { type, id } = node;
	if (type === 'merchant_id') {
		// if (id.startsWith('dec45eae')) return 'HERE';
		return useMerchantStore().getMerchantById(id)?.name;
	} else if (type === 'category_id') {
		return useCategoryStore().getCategoryById(id)?.name;
	} else if (type === 'budget_id') {
		return useBudgetStore().getBudgetById(id)?.memo;
	}
	console.warn('No descriptor found for node', node);
	return null;
}

/*******************
 * UPSERTING
 */
const upsertRuleModal = ref<InstanceType<typeof DrawerModal> | null>(null);
const editingRule = ref<TransactionRuleDraft | null>(null);

watch(editingRule, (newVal) => {
	if (newVal) {
		upsertRuleModal.value?.open();
	} else {
		upsertRuleModal.value?.close();
	}
});

function editRule(rule: TransactionRuleDraft) {
	upsertRuleModal.value?.open();
	editingRule.value = jsonCopy(rule);
}
function draftRule(rule?: TransactionRuleDraft) {
	editRule(rule || { filter: { AND: filterSuggestions.value.length ? [] : [ { property: '' as any, operator: '' as any } ] }, actions: [ { action: '' as any, value: {} } ] });
}
const isNewRule = computed(() => !editingRule.value?.transaction_rule_id);

const isSavingRule = ref(false);
async function saveRule() {
	if (!editingRule.value) return;

	try {
		isSavingRule.value = true;
		// This endpoint upserts
		const { data } = await request.post('/transaction-rule', editingRule.value);
		toast.add({
			severity: 'success',
			summary: 'Success',
			detail: 'Rule saved successfully.',
			life: 3000,
		});
		if (!editingRule.value.transaction_rule_id) {
			rules.value.push(data.data);
		} else {
			const index = rules.value.findIndex((r) => r.transaction_rule_id === editingRule.value?.transaction_rule_id);
			if (index !== -1) {
				rules.value[index] = data.data;
			}
		}
		upsertRuleModal.value?.close();
	} catch (error) {
		toast.add({
			severity: 'error',
			summary: 'Error',
			detail: 'Failed to save rule. Please try again later.',
			life: 3000,
		});
	} finally {
		isSavingRule.value = false;
	}
}

function isFilterComplete(filter) {
	return !!filter && FilterUtils.extractPredicates(filter).every((rule) => rule.property && rule.operator && rule.operand);
}

const canSave = computed(() => {
	if (!isFilterComplete(editingRule.value?.filter)) return false;
	return true;
});

const ActionOptions = Object.keys(Actions).map((key) => ({
	label: Actions[key as ActionType].label,
	value: key,
}));

async function deleteRule(rule: TransactionRuleDraft) {
	if (!rule || !rule.transaction_rule_id) return;
	if (!(await usePrompt().delete({ message: 'Are you sure you want to delete this rule? This action cannot be undone.' }))) return;
	try {
		isSavingRule.value = true;
		await request.delete(`/transaction-rule/${rule.transaction_rule_id}`);
		rules.value = rules.value.filter((r) => r.transaction_rule_id !== rule.transaction_rule_id);
		editingRule.value = null;
		toast.add({
			severity: 'success',
			summary: 'Success',
			detail: 'Rule deleted successfully.',
			life: 3000,
		});
	} catch (error) {
		toast.add({
			severity: 'error',
			summary: 'Error',
			detail: 'Failed to delete rule. Please try again later.',
			life: 3000,
		});
	} finally {
		isSavingRule.value = false;
	}
}

const filterSuggestions = computed<Predicate[]>(() => {
	if (!props.templateEvent) return [];
	const existingPredicates = editingRule.value ? FilterUtils.extractPredicates(editingRule.value.filter) : [];
	const suggestedProperties: Property[] = ['Transaction.original_description', 'Transaction.merchant_id', 'category_id', 'amount'];
	return suggestedProperties
		.map((p) => {
			if (existingPredicates.find((pred) => pred.property === p)) return null;
			const value = FilterUtils.getFilterableValue(props.templateEvent!, p);
			if (value) {
				if (p === 'Transaction.original_description') {
					// Suggest includes identifier from description
					const bestIdentifier = TransactionUtils.extractDescriptionInfo(value)?.best_identifier;
					if (bestIdentifier) {
						return {
							property: p,
							operator: 'inc',
							operand: bestIdentifier,
						} as Predicate;
					}
				}
				return {
					property: p,
					operator: 'eq',
					operand: value,
				} as Predicate;
			}
		})
		.filter((r): r is Predicate => !!r);
});
</script>

<template>
	<div class="rules-view">
		<div class="rules-container">
			<div class="flex flex-column gap-1" v-if="rules.length > 0">
				<div
					v-for="rule in rules"
					:key="rule.transaction_rule_id"
					class="flex align-items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 border-round hover-show-trigger"
					@click="editRule(rule)"
				>
					<!-- Use avatars to indicate the result of the action -->
					<AttributionAvatar
						v-if="findAction(rule, 'merchant_id')"
						:image="useMerchantStore().getMerchantById(findAction(rule, 'merchant_id')?.value.merchant_id as string)?.logo"
						:size="2.3"
					/>
					<AttributionAvatar
						v-else-if="findAction(rule, 'category_id')"
						:category="useCategoryStore().getCategoryById(findAction(rule, 'category_id')?.value.category_id as string)"
						:size="2.3"
					/>
					<AttributionAvatar
						v-else-if="findAction(rule, 'budget_id')"
						:category="useBudgetStore().getBudgetById(findAction(rule, 'budget_id')?.value.budget_id as string)?.Category"
						:size="2.3"
					/>
					<AttributionAvatar v-else icon="material-symbols::manufacturing" :size="2.3" />
					<div class="flex flex-column flex-grow-1 min-w-0 text-ellipsis">
						<div class="text-ellipsis font-medium">
							{{ TransactionRuleUtils.ruleDescription(rule).actions[0]?.verb }}
							{{ TransactionRuleUtils.ruleDescription(rule).actions[0]?.target }}
							→
							{{ TransactionRuleUtils.ruleDescription(rule).actions[0]?.valueDescriptor.toString(descriptorGetter) }}
						</div>
						<small class="text-ellipsis">When: {{ FilterUtils.describeFilter(rule.filter).toString(descriptorGetter) }}</small>
					</div>
					<div class="flex-grow-1" />
					<div class="hover-show">
						<Button text :severity="'secondary'" icon="pi pi-pencil" />
					</div>
				</div>
			</div>

			<div v-else class="no-rules">
				<p>No rules found. Add your first rule to get started.</p>
			</div>
		</div>

		{{ filterSuggestions.length }}
	</div>

	<DrawerModal ref="upsertRuleModal" width="38rem">
		<template #header>
			<h3 class="flex align-items-center gap-2">
				<Icon name="material-symbols::manufacturing" />
				{{ isNewRule ? 'New' : 'Edit' }} Automation Rule
			</h3>
		</template>

		<div v-if="editingRule" class="flex flex-column gap-3 mb-4">
			<div>
				<h4 class="mb-1">When...</h4>
				<div class="flex flex-wrap gap-2 my-2">
					<Button
						v-for="predicate in filterSuggestions"
						:key="predicate.property"
						severity="secondary"
						@click="editingRule.filter = FilterUtils.combineFilters(editingRule.filter, predicate)"
						style="max-width: 100%"
						size="small"
					>
						<div class="flex align-items-center gap-2 w-full">
							<i class="pi pi-lightbulb"></i>
							<div class="text-ellipsis">{{ FilterUtils.describePredicate(predicate).toString(descriptorGetter) }}</div>
						</div>
					</Button>
				</div>
				<FilterBuilder v-model="editingRule.filter" :key="JSON.stringify(editingRule.filter)" />
			</div>

			<div>
				<h4 class="mb-1">Then...</h4>
				<div v-for="(action, index) in editingRule.actions" :key="index" class="flex align-items-start gap-2 mb-2">
					<div class="flex align-items-center gap-2">
						<Select
							v-model="action.action"
							:options="ActionOptions"
							option-label="label"
							option-value="value"
							class="w-11rem"
							placeholder="Action..."
						/>
						<b class="text-xl">→</b>
					</div>
					<div class="flex flex-wrap gap-2 flex-grow-1">
						<template v-for="field in Actions[action.action]?.form || []" :key="field.key">
							<MerchantButton v-if="field.type === 'merchant_id'" v-model="action.value[field.key]" />
							<CategoryButton v-if="field.type === 'category_id'" v-model="action.value[field.key]" />
							<BudgetButton v-if="field.type === 'budget_id'" v-model="action.value[field.key]" />
							<InputText v-if="field.type === 'string'" v-model="action.value[field.key]" :placeholder="field.placeholder || ''" />
							<div v-else-if="field.type === 'number'" class="flex flex-column">
								<label :for="`action-${index}-${field.key}`" class="text-sm">{{ field.label }}</label>
								<input
									type="number"
									:id="`action-${index}-${field.key}`"
									v-model.number="action.value[field.key]"
									:placeholder="field.placeholder || ''"
									class="p-inputtext p-component w-20rem"
								/>
							</div>
						</template>
					</div>
					<Button icon="pi pi-trash" severity="secondary" text @click="editingRule.actions.splice(index, 1)" />
				</div>
				<Button label="Add Action" icon="pi pi-plus-circle" text @click="editingRule.actions.push({ action: '', value: {} })" />
			</div>
		</div>
		<div class="flex gap-2">
			<Button
				v-if="!isNewRule && editingRule"
				icon="pi pi-trash"
				class="p-button-text"
				label="Delete"
				severity="secondary"
				@click="() => deleteRule(editingRule!)"
			/>
			<div class="flex-grow-1" />
			<Button class="p-button-text" label="Cancel" @click="editingRule = null" />
			<Button label="Save Rule" :loading="isSavingRule" :disabled="isSavingRule || !canSave" @click="saveRule" />
		</div>
	</DrawerModal>
</template>

<style scoped>
.rules-view {
	max-width: 1200px;
	margin: 0 auto;
}

.header-actions {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1rem;
}

.actions {
	display: flex;
	gap: 0.5rem;
}

.loading {
	text-align: center;
	padding: 2rem;
}

.no-rules {
	text-align: center;
	padding: 2rem;
	background-color: #f8f8f8;
	border-radius: 4px;
}
</style>
