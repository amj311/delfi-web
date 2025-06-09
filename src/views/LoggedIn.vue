<script setup lang="ts">
import PlaidLink from '@/components/plaid/PlaidLink.vue';
import { useAccountStore } from '@/stores/account.store';
import { useCategoryStore } from '@/stores/category.store';
import { useDelfiStore } from '@/stores/delfi.store';
import { usePlannedTransactionStore } from '@/stores/plannedTransaction.store';
import { date } from 'delfi-core/utils/dateUtils';
import { computed, onBeforeMount, reactive } from 'vue';
import { RouterView } from 'vue-router'

const delfiStore = useDelfiStore();
const accountStore = useAccountStore();
const transactionStore = usePlannedTransactionStore();
const categoryStore = useCategoryStore();

async function initApp() {
	try {
		await Promise.all([
			await accountStore.loadAccounts(),
			await transactionStore.loadPlannedTransactions(),
			await categoryStore.loadCategories(),
		]);

		await delfiStore.initDelfi({
			accounts: accountStore.accounts,
			plannedTransactions: transactionStore.plannedTransactions,
			categories: categoryStore.categories,
		})
	}
	catch (error) {
		console.error('Error initializing app:', error);
	}
}

onBeforeMount(() => {
	initApp();
});

</script>

<template>
	<PlaidLink />
	<RouterView v-if="!delfiStore.isInitializing" />
</template>

<style scoped></style>
