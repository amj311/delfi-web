<script setup lang="ts">
import AttributionAvatar from '@/components/AttributionAvatar.vue';
import CollapseList from '@/components/utils/CollapseList.vue';
import CommonEventRow from '@/components/CommonEventRow.vue';
import Currency from '@/components/Currency.vue';
import TransactionDetailsDrawer from '@/components/TransactionDetailsDrawer.vue';
import { TransactionService } from '@/services/transaction.service';
import { useAccountStore } from '@/stores/account.store';
import { useDelfiStore } from '@/stores/delfi.store';
import dayjs from 'dayjs';
import type { ProjectionEvent } from 'delfi-core/models/Budget';
import { TransactionUtils, type AttributionEvent, type Transaction } from 'delfi-core/models/Transaction';
import { ddate } from 'delfi-core/utils/dateUtils';
import { computed, nextTick, onBeforeMount, ref, watch } from 'vue';


const upcomingBudgets = ref<ProjectionEvent[]>([]);

const isDelfiLoading = computed(() => !useDelfiStore().delfi || useDelfiStore().isInitializing || useDelfiStore().isGeneratingForecast);
const isLoadingNextBudgets = ref(false);

watch(() => useDelfiStore().isGeneratingForecast, async () => {
	if (isDelfiLoading.value) {
		return [];
	}
	isLoadingNextBudgets.value = true;
	const thisMonth = ddate().startOf('month');
	const nextMonth = thisMonth.add(1, 'month');
	const thisMonthSummary = await useDelfiStore().getMonthSummary(thisMonth);
	const nextMonthSummary = await useDelfiStore().getMonthSummary(nextMonth);
	const allUnfinished = [
		...thisMonthSummary.forecast.unfinishedBudgetEvents,
		...nextMonthSummary.forecast.unfinishedBudgetEvents,
	]
	// from the previous or next two weeks
	upcomingBudgets.value = allUnfinished.filter(e => e.date >= ddate().subtract(1, 'week') && e.date <= ddate().add(2, 'week'));
	isLoadingNextBudgets.value = false;
}, { immediate: true });

const isLoadingRecentTransactions = ref(false);
const recentTransactions = ref<AttributionEvent[]>([]);
async function loadRecentTransactions() {
	try {
		isLoadingRecentTransactions.value = true;
		const transactions = await TransactionService.getTransactionsInRange(ddate().subtract(1, 'week'), ddate());
		recentTransactions.value = TransactionUtils.processAttributionEvents(transactions);
	} catch (e) {
		console.error('Error loading recent transactions', e);
	} finally {
		isLoadingRecentTransactions.value = false;
	}
};
onBeforeMount(loadRecentTransactions);

const transactionDetailsDrawer = ref<InstanceType<typeof TransactionDetailsDrawer> | null>(null);
const viewingTransaction = ref<Transaction | null>(null);
function viewTransaction(transaction: Transaction) {
	viewingTransaction.value = transaction;
	nextTick(() => {
		transactionDetailsDrawer.value?.open(transaction);
	});
}

</script>

<template>
	<br />
	<h3>Accounts</h3>
	<div v-if="useAccountStore().isLoadingAccounts" class="flex align-items-center gap-2"><i class="pi pi-spin pi-spinner"></i>Loading accounts...</div>
	<div v-for="account in useAccountStore().accounts" :key="account.account_id">
		<div class="flex align-items-center gap-2 border-bottom-1 border-gray-200 py-2" @click="() => $router.push(`/accounts/${account.account_id}`)" style="cursor: pointer;">
			<AttributionAvatar :image="account.Institution.logo":size="2.5" square />
			<div class="flex flex-column">
				<div>
					<span class="font-semibold">{{ account.display_name || account.external_name }}</span>
					**** {{ account.mask }}
				</div>
				<small>{{ dayjs(account.last_successful_sync).fromNow() }}</small>
			</div>
			<div class="flex-grow-1"></div>
			<Currency :amount="account.current_balance" mode="balance" class="font-medium" />
		</div>
	</div>

	<div v-if="isDelfiLoading" class="flex align-items-center gap-2 my-4 justify-content-center"><i class="pi pi-spin pi-spinner"></i>Computing forecast...</div>

	<template v-if="isLoadingNextBudgets || upcomingBudgets.length">
		<br />
		<h3 class="my-2">Upcoming Budgets</h3>
		<div v-if="isLoadingNextBudgets" class="flex align-items-center gap-2 my-2"><i class="pi pi-spin pi-spinner"></i>Loading upcoming budgets...</div>
		<CollapseList :items="upcomingBudgets">
			<template #default="{ item }">
				<CommonEventRow :event="item" showPastDue />
			</template>
		</CollapseList>
	</template>

	<template v-if="recentTransactions.length">
		<br />
		<h3 class="my-2">Recent Transactions</h3>
		<CollapseList :items="recentTransactions">
			<template #default="{ item }">
				<CommonEventRow :event="item" @click="viewTransaction(item.attributionDetails.sourceTransaction)" />
			</template>
		</CollapseList>
	</template>

	<TransactionDetailsDrawer ref="transactionDetailsDrawer" :key="viewingTransaction?.transaction_id" @close="loadRecentTransactions" />
</template>