<script setup lang="ts">

import { useAccountStore } from '@/stores/account.store';
import { useCategoryStore } from '@/stores/category.store';
import { useDelfiStore } from '@/stores/delfi.store';
import { useBudgetStore } from '@/stores/budget.store';
import { date } from 'delfi-core/utils/dateUtils';
import { computed, onBeforeMount, reactive } from 'vue';
import { RouterView } from 'vue-router'
import Icon from '@/components/Icon.vue';

const delfiStore = useDelfiStore();
const accountStore = useAccountStore();
const budgetStore = useBudgetStore();
const categoryStore = useCategoryStore();

async function initApp() {
	try {
		await Promise.all([
			await accountStore.loadAccounts(),
			await budgetStore.loadBudgets(),
			await categoryStore.loadCategories(),
		]);

		await delfiStore.initDelfi();
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
	<div class="app-container">
		<header class="app-header">
			<nav class="main-nav">
				<router-link to="/month" class="nav-link flex align-items-center gap-1">
					<Icon name="wallet" />
					Budget
				</router-link>
				<router-link to="/accounts" class="nav-link flex align-items-center gap-1">
					<Icon name="bank" />
					Accounts
				</router-link>
				<router-link to="/categories" class="nav-link flex align-items-center gap-1">
					<Icon name="category" />
					Categories
				</router-link>
			</nav>
		</header>
		<main class="app-content">
			<RouterView v-if="!delfiStore.isInitializing" />
		</main>
	</div>
</template>

<style scoped>
.app-container {
	display: flex;
	flex-direction: column;
	min-height: 100vh;
}

.app-header {
	padding: 1rem;
	background-color: #f5f5f5;
	border-bottom: 1px solid #e0e0e0;
}

.main-nav {
	display: flex;
}

.nav-link {
	padding: 0.5rem 1rem;
	text-decoration: none;
	color: #333;
	font-weight: 500;
}

.nav-link.router-link-active {
	color: #4CAF50;
	border-bottom: 2px solid #4CAF50;
}

.app-content {
	flex: 1;
	padding: 1rem;
}
</style>
