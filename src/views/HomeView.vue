<script setup lang="ts">
import { useDelfiStore } from '@/stores/delfi.store';
import { useAccountStore } from '@/stores/account.store';
import { reactive, ref } from 'vue';
import { useTransactionScheduleStore } from '@/stores/transactionSchedule.store';

const delfiStore = useDelfiStore();
const accountStore = useAccountStore();
const transactionStore = useTransactionScheduleStore();

const state = reactive({
	loading: false,
	chartData: [],
});

(async () => {
	state.loading = true;
	await accountStore.loadAccounts();
	await transactionStore.loadTransactionSchedules();
	delfiStore.delfi.init({
		accounts: delfiStore.translateAccounts(accountStore.accounts),
		transactions: delfiStore.translateTransactionSchedules(transactionStore.transactionSchedules),
	});
	delfiStore.delfi.computeForecast()
	state.loading = false;
})();



</script>

<template>
	<main>
		<div v-if="state.loading">Loading...</div>

		<h2>Accounts</h2>
		<!-- <PlaidLink /> -->
		<div v-for="account of accountStore.accounts">
			{{ account.name }}
		</div>

		<br/>
		<div v-for="transaction of transactionStore.transactionSchedules">
			{{ transaction.memo }}
		</div>

		<br />
		<h2>Forecast</h2>
		<div v-for="snapshot of delfiStore.delfi.forecast?.snapshots">
			{{ snapshot.event.memo }}
		</div>
	</main>
</template>
