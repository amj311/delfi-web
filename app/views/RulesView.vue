<script setup lang="ts">
import { onBeforeMount, ref } from 'vue';
import { type TransactionRule } from 'delfi-core/models/TransactionRule';
import request from '@/services/request';
import Button from 'primevue/button';
import RulesList from '@/components/RulesList.vue';

const rules = ref<Array<TransactionRule>>([]);
const isLoadingRules = ref(false);

onBeforeMount(async () => {
	isLoadingRules.value = true;
	const { data } = await request.get('/transaction-rule');
	rules.value = data.data;
	isLoadingRules.value = false;
});

const rulesList = ref<InstanceType<typeof RulesList> | null>(null);

</script>

<template>
	<div class="rules-view">
		<div class="header-actions">
			<h2>Automation Rules</h2>
			<div class="actions">
				<Button label="Add rule" @click="() => rulesList?.draftRule()" />
			</div>
		</div>

		<div v-if="isLoadingRules" class="loading">Loading rules...</div>
		<RulesList ref="rulesList" v-else v-model="rules" />
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
