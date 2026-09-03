<script setup lang="ts">
import { useBudgetStore } from '@/stores/budget.store';
import UpsertBudgetDrawer from './UpsertBudgetDrawer.vue';

const budgetStore = useBudgetStore();
</script>

<template>
	<UpsertBudgetDrawer
		:key="budgetStore.upsertingBudget?.budget_id"
		:budget="budgetStore.upsertingBudget"
		:on-close="budgetStore.closeUpsertBudget"
	/>
</template>
