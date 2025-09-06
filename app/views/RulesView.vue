<script setup lang="ts">
import { useCategoryStore } from '@/stores/category.store';
import { computed, onBeforeMount, ref, watch } from 'vue';
import AttributionAvatar from '@/components/AttributionAvatar.vue';
import { Actions, type Action, type ActionType, type TransactionRule } from 'delfi-core/models/TransactionRule';
import request from '@/services/request';
import FilterUtils from 'delfi-core/models/Filters';
import Button from 'primevue/button';
import DrawerModal from '@/components/utils/DrawerModal.vue';
import Icon from '@/components/Icon.vue';
import { jsonCopy } from 'delfi-core/utils/miscUtils';
import { useToast } from 'primevue/usetoast';
import FilterBuilder from '@/components/FilterBuilder.vue';

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

function findActionDefs(rule: TransactionRule, action?: Action | ActionType): Record<string, { text: string; data: any }> {
	if (typeof action === 'string') {
		action = rule.actions.find((a) => a.action === action);
	};
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

function getActionDescription(action: TransactionRule['actions'][0], rule: TransactionRule) {
	const { action: actionName, value } = action;
	const labels = findActionDefs(rule, action);
	return {
		actionVerb: Actions[actionName].verb || '',
		actionTarget: Actions[actionName]?.label || actionName,
		// TODO this will not match more complex action values
		actionValue: labels[actionName]?.text as string || value[actionName],
	};
}


/*******************
 * UPSERTING
 */
const upsertRuleModal = ref<InstanceType<typeof DrawerModal> | null>(null);
const editingRule = ref<TransactionRule | null>(null);

watch(editingRule, (newVal) => {
	if (newVal) {
		upsertRuleModal.value?.open();
	} else {
		upsertRuleModal.value?.close();
	}
});

function editRule(rule: TransactionRule) {
	upsertRuleModal.value?.open();
	editingRule.value = jsonCopy(rule);
}
const isNewRule = computed(() => !editingRule.value?.transaction_rule_id);

const isSavingRule = ref(false);
async function saveRule() {
	try {
		isSavingRule.value = true;
		// This endpoint upserts
		await request.post('/transaction-rule', editingRule.value);
		upsertRuleModal.value?.close();
		toast.add({
			severity: 'success',
			summary: 'Success',
			detail: 'Rule saved successfully.',
			life: 3000
		});
	} catch (error) {
		toast.add({
			severity: 'error',
			summary: 'Error',
			detail: 'Failed to save rule. Please try again later.',
			life: 3000
		});
	} finally {
		isSavingRule.value = false;
	}
}

function isFilterComplete(filter) {
	return !!filter && FilterUtils.extractPredicates(filter).every((rule) => rule.property && rule.operator && rule.operand);
};

const canSave = computed(() => {
	if (!isFilterComplete(editingRule.value?.filter)) return false;
	return true;
});
</script>

<template>
	<div class="rules-view">
		<div class="header-actions">
			<h2>Automation Rules</h2>
			<div class="actions">
				<button class="btn primary">Add rule</button>
			</div>
		</div>

		<div v-if="isLoadingRules" class="loading">Loading rules...</div>

		<div v-else class="rules-container">
			<div class="flex flex-column gap-1" v-if="rules.length > 0">
				<div
					v-for="rule in rules"
					:key="rule.transaction_rule_id"
					class="flex align-items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 border-round hover-show-trigger"
					@click="editRule(rule)"
				>
					<!-- Use avatars to indicate the result of the action -->
					<AttributionAvatar
						v-if="findMerchantAction(rule.actions)"
						:image="findActionDefs(rule, 'merchant_id').merchant_id?.data.logo"
						:size="2.5"
					/>
					<AttributionAvatar
						v-else-if="findCategoryAction(rule.actions)"
						:category="findActionDefs(rule, 'category_id').category_id?.data"
						:size="2.5"
					/>
					<AttributionAvatar v-else icon="material-symbols::manufacturing" :size="2.5" />
					<div class="flex flex-column flex-grow-1 min-w-0 text-ellipsis">
						<div class="text-ellipsis font-medium">
							{{ getActionDescription(rule.actions[0], rule).actionVerb }}
							{{ getActionDescription(rule.actions[0], rule).actionTarget }}
							→
							{{ getActionDescription(rule.actions[0], rule).actionValue }}
						</div>
						<small class="text-ellipsis">When: {{ FilterUtils.describeFilter(rule.filter, rule.defs) }}</small>
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
				<FilterBuilder v-model="editingRule.filter" />
			</div>

			<div>
				<h4 class="mb-1">Then...</h4>
			</div>
		</div>
		<div class="flex gap-2">
			<div class="flex-grow-1" />
			<Button class="p-button-text" label="Cancel" @click="editingRule = null" />
			<Button label="Save" :loading="isSavingRule" :disabled="isSavingRule || !canSave" @click="saveRule" />
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
