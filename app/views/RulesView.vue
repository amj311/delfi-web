<script setup lang="ts">
import { useCategoryStore } from '@/stores/category.store';
import { computed, onBeforeMount, ref, watch } from 'vue';
import AttributionAvatar from '@/components/AttributionAvatar.vue';
import { Actions, TransactionRuleUtils, type Action, type ActionType, type TransactionRule, type TransactionRuleDraft } from 'delfi-core/models/TransactionRule';
import request from '@/services/request';
import FilterUtils from 'delfi-core/models/Filters';
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
import RulesList from '@/components/RulesList.vue';

const toast = useToast();
const categoryStore = useCategoryStore();
const rules = ref<Array<TransactionRule>>([]);
const isLoadingRules = ref(false);

onBeforeMount(async () => {
	isLoadingRules.value = true;
	const { data } = await request.get('/transaction-rule');
	rules.value = data.data;
	isLoadingRules.value = false;
});

function findMerchantAction(actions: TransactionRule['actions']) {
	return actions.find((action) => action.action.includes('merchant_id'));
}

function findCategoryAction(actions: TransactionRule['actions']) {
	return actions.find((action) => action.action.includes('category_id'));
}

function findAction(rule: TransactionRule, actionName: string) {
	return rule.actions?.find((action) => action.action === actionName);
}

function findActionDefs(rule: TransactionRule, action?: Action | ActionType): Record<string, { text: string; data: any }> {
	if (typeof action === 'string') {
		action = findAction(rule, action);
	}
	if (!action) return {};
	const defs = rule.defs || {};
	const labels = {};
	for (const key in action.value) {
		const defId = action.value[key];
		if (defs && defId && typeof defId === 'string' && defs[defId]) {
			labels[key] = defs[defId];
		}
	}
	return labels;
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
		}
		else {
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
</script>

<template>
	<div class="rules-view">
		<div class="header-actions">
			<h2>Automation Rules</h2>
			<div class="actions">
				<Button label="Add rule" @click="() => editRule({ filter: { AND: [ { property: '' as any } ] }, actions: [ { action: '' as any, value: {} } ] })" />
			</div>
		</div>

		<div v-if="isLoadingRules" class="loading">Loading rules...</div>
		<RulesList v-else v-model="rules" />
	</div>
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
