<script setup lang="ts">

import { useAccountStore } from '@/stores/account.store';
import { useCategoryStore } from '@/stores/category.store';
import { useDelfiStore } from '@/stores/delfi.store';
import { useBudgetStore } from '@/stores/budget.store';
import { onBeforeMount } from 'vue';
import { RouterView } from 'vue-router'
import Icon from '@/components/Icon.vue';
import TransactionSelectionSnackbar from '@/components/TransactionSelectionSnackbar.vue';

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
		<main class="app-content">
			<RouterView v-if="!delfiStore.isInitializing" />
		</main>

		<header class="app-header">
			<nav class="main-nav flex-row-center">
				<router-link to="/" class="nav-link">
					<Icon class="text-xl" name="pi::home" />
					<div class="nav-label">Home</div>
				</router-link>
				<router-link to="/month" class="nav-link">
					<Icon class="text-xl" name="pi::wallet" />
					<div class="nav-label">Budget</div>
				</router-link>
				<router-link to="/accounts" class="nav-link">
					<Icon class="text-xl" name="bank" />
					<div class="nav-label">Accounts</div>
				</router-link>
				<!-- <router-link to="/categories" class="nav-link">
					<Icon class="text-xl" name="category" />
					<div class="nav-label">Categories</div>
				</router-link> -->
				<router-link to="/rules" class="nav-link">
					<Icon class="text-xl" name="material-symbols::manufacturing" />
					<div class="nav-label">Rules</div>
				</router-link>
			</nav>
		</header>

		<TransactionSelectionSnackbar />
	</div>
</template>

<style scoped>
.app-container {
	display: flex;
	flex-direction: column;
	min-height: 100vh;
}

.app-header {
	position: sticky;
	bottom: 0;
	z-index: 3;
	padding: 0.5rem;
	background-color: #f5f5f5;
	border-bottom: 1px solid #e0e0e0;
}

.nav-link {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 0.5rem 1rem;
	height: 3rem;
	text-decoration: none;
	color: #333;
	gap: 0.2em;
	border-radius: 0.5rem;
}

.nav-link.router-link-active {
	color: #4CAF50;
	background-color: #4CAF5022;
}

.nav-label {
	font-size: 0.9em;
}

.app-content {
	flex: 1;
	padding: 1rem;
}
</style>
