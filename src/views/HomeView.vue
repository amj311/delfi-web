<script setup lang="ts">
import PlaidLink from '@/components/plaid/PlaidLink.vue';
import { accounts, initialAccounts, scheduledTransactions } from '../../delfi-core/dummyData';
import { useDelfiStore } from '@/stores/delfi';

const { delfi, initDelfi } = useDelfiStore();
initDelfi({
	accounts: initialAccounts,
	transactions: scheduledTransactions
})

</script>

<template>
	<main>
		<div>Plaid</div>
		<PlaidLink />
		<div v-for="account of accounts">
			{{ account.name }}
		</div>


		<div v-for="transaction of scheduledTransactions">
			{{ transaction.id }}
		</div>
	</main>
</template>