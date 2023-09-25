<script setup lang="ts">
import PlaidLink from '@/components/plaid/PlaidLink.vue';
import { accounts, initialAccounts, scheduledTransactions } from '../../delfi-core/dummyData';
import { useDelfiStore } from '@/stores/delfi';
import { useAccountStore } from '@/stores/account';
import { ref } from 'vue';
import { useTransactionScheduleStore } from '@/stores/transactionSchedule';

const delfiStore = useDelfiStore();
const accountStore = useAccountStore();
const transactionStore = useTransactionScheduleStore();

let loading = ref(true);

(async () => {
	await accountStore.loadAccounts();
	console.log(accountStore.accounts)
	await transactionStore.loadTransactionSchedules();
	delfiStore.delfi.init({
		accounts: initialAccounts,
		transactions: scheduledTransactions
	});
	loading.value = false;
})();



</script>

<template>
	<main>
		<div v-if="loading">Loading...</div>

		<h2>Accounts</h2>
		<!-- <PlaidLink /> -->
		<div v-for="account of accountStore.accounts">
			{{ account.name }}
		</div>

		<br/>
		<div v-for="transaction of scheduledTransactions">
			{{ transaction.id }}
		</div>

		<br />
		<h2>Forecast</h2>
		<button @click="delfiStore.delfi.computeForecast()">Compute</button>
		<div v-for="snapshot of delfiStore.delfi.forecast">
			{{ snapshot.event.memo }}
		</div>
	</main>
</template>
