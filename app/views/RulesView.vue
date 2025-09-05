<script setup lang="ts">
import { useCategoryStore } from '@/stores/category.store';
import { onBeforeMount, ref } from 'vue';
import AttributionAvatar from '@/components/AttributionAvatar.vue';
import { PrettyActions, type TransactionRule } from 'delfi-core/models/TransactionRule';
import request from '@/services/request';
import FilterUtils from 'delfi-core/models/Filters';

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
	return actions.find(action => action.action.includes('merchant_id'));
}

function findCategoryAction(actions: TransactionRule['actions']) {
	return actions.find(action => action.action.includes('category_id'));
}

function findActionDef(action: TransactionRule['actions'][0], defs: TransactionRule['defs']) {
	if (!defs) return undefined;
	return defs[action.value];
}

function getActionDescription(action: TransactionRule['actions'][0], defs: TransactionRule['defs'] = {}) {
	const { action: actionName, value } = action;
	const def = findActionDef(action, defs);
	return {
		actionVerb: 'Set',
		actionTarget: PrettyActions[actionName] || actionName,
		actionValue: defs?.[value]?.text || value
	}
}

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
				<div v-for="rule in rules" :key="rule.transaction_rule_id" class="flex align-items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 border-round">
					<!-- Use avatars to indicate the result of the action -->
					<AttributionAvatar v-if="findMerchantAction(rule.actions)" :image="findActionDef(findMerchantAction(rule.actions)!, rule.defs)?.data.logo" :size="2.5" />
					<AttributionAvatar v-else-if="findCategoryAction(rule.actions)" :category="findActionDef(findCategoryAction(rule.actions)!, rule.defs)?.data" :size="2.5" />
					<AttributionAvatar v-else icon="material-symbols::manufacturing" :size="2.5" />
					<div class="flex flex-column">
						<div>
							{{ getActionDescription(rule.actions[0], rule.defs).actionVerb }}
							<b class="font-medium">{{ getActionDescription(rule.actions[0], rule.defs).actionTarget }}</b>
							→
							{{ getActionDescription(rule.actions[0], rule.defs).actionValue }}
						</div>
						<small>When: {{ FilterUtils.describeFilter(rule.filter, rule.defs) }}</small>
					</div>
				</div>
			</div>

			<div v-else class="no-rules">
				<p>No rules found. Add your first rule to get started.</p>
			</div>
		</div>
	</div>
</template>

<style scoped>
.rules-view {
	max-width: 1200px;
	margin: 0 auto;
	padding: 1rem;
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
