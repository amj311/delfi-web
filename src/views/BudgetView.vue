<script setup lang="ts">
import { useDelfiStore } from '@/stores/delfi.store';
import { useAccountStore } from '@/stores/account.store';
import { computed, reactive, ref } from 'vue';
import { usePlannedTransactionStore } from '@/stores/plannedTransaction.store';
import Forecast from '../../delfi-core/models/Forecast';
import { type DelfiDate, date} from '../../delfi-core/utils/dateUtils';
import Currency from '@/components/Currency.vue';
import { useBudgetStore } from '@/stores/budget.store';
import { useCategoryStore } from '@/stores/category.store';
import type { Account, Budget, PlannedTransaction } from 'models/types';
import UpsertAccountForm from '@/components/UpsertAccountForm.vue';
import UpsertPlannedTransactionForm from '@/components/UpsertPlannedTransactionForm.vue';
import UpsertBudgetForm from '@/components/UpsertBudgetForm.vue';
import type { Delfi } from 'delfi-core';

const delfiStore = useDelfiStore();
const accountStore = useAccountStore();
const transactionStore = usePlannedTransactionStore();
const budgetStore = useBudgetStore();
const categoryStore = useCategoryStore();

const state = reactive({
	loading: false,
	viewingMonth: <DelfiDate><unknown>null,
	forecast: <Forecast><unknown>null,
	upsertingAccount: <Account | {} | null>null,
	upsertingPlannedTransaction: <PlannedTransaction | {} | null>null,
	upsertingBudget: <Budget | {} | null>null,
	summaryData: <ReturnType<Delfi["getMonthSummary"]> | null>null,
});

const getSummary = (month: DelfiDate) => {
	if (!state.viewingMonth || !delfiStore.delfi?.forecast) {
		return null;
	}
	let summary = delfiStore.delfi.getMonthSummary(month);
	return summary;
};

const createDelfi = async () => {
	state.loading = true;
	
	await delfiStore.initDelfi({
		accounts: accountStore.accounts,
		planned_transactions: transactionStore.plannedTransactions,
		budgets: budgetStore.budgets,
		user_categories: categoryStore.categories,
	})
	state.forecast = await delfiStore.delfi.createFullForecast(state.viewingMonth, date(state.viewingMonth.add(1, 'year')));
	state.summaryData = getSummary(state.viewingMonth);
	state.loading = false;
};

(async () => {
	state.loading = true;
	state.viewingMonth = date(date().startOf('month'));
	
	await Promise.all([
		await accountStore.loadAccounts(),
		await transactionStore.loadPlannedTransactions(),
		await budgetStore.loadBudgets(),
		await categoryStore.loadCategories(),
	]);

	await createDelfi();
	state.loading = false;
})();

const canGoBack = computed(() => {
	if (!state.viewingMonth) {
		return false;
	}
	return state.viewingMonth.isAfter(date().startOf('month'));
});

const goForward = () => {
	if (!state.viewingMonth) {
		return;
	}
	state.viewingMonth = date(state.viewingMonth.add(1, 'month'));
	state.summaryData = getSummary(state.viewingMonth);
};

const goBack = () => {
	if (!canGoBack.value) {
		return;
	}
	if (!state.viewingMonth) {
		return;
	}
	state.viewingMonth = date(state.viewingMonth.subtract(1, 'month'));
	state.summaryData = getSummary(state.viewingMonth);
};

</script>

<template>
	<main>
		<h2>Monthly Budget</h2>
		<div style="display: flex; justify-content: space-between">
			<a @click="goBack()">Back</a>
			<span>{{ state.viewingMonth?.format('MMMM YYYY') }}</span>
			<a @click="goForward()">Forward</a>
		</div>
		<br />
		<div v-if="state.loading">Loading...</div>

		<div v-if="state.summaryData">
			<div>
				<h3>Accounts</h3>
				<div>Net Growth ...... <Currency :amount="state.summaryData.timeline.change('total')" mode="net_change" /></div>
				<div class="list">
					<div v-for="summary of state.summaryData.accountSummaries" class="list-row">
						<div class="flex-between hover-show-trigger">
							<div class="flex-center gap-2">
								<div class="text-semibold">{{ accountStore.getAccountById(summary.account.account_id)?.display_name }}</div>
								<button class="hover-show" @click="() => state.upsertingAccount = accountStore.getAccountById(summary.account.account_id)">Edit</button>
							</div>
							<div class="flex-center">
								<small v-if="summary.change !== 0">
									<Currency :amount="summary.change" mode="net_change" hideCurrency />
									&emsp13;
								</small>
								<span class="text-semibold"><Currency :amount="summary.endingBalance" mode="balance" /></span>
							</div>
						</div>
						<small v-for="partition of summary.account.partitions" class="flex-between">
							&emsp13;- {{partition.name}}
							<div class="flex-center">
								{{ console.log(summary.partitionSummaries.get(partition.account_partition_id)) }}
								<small v-if="summary.partitionSummaries.get(partition.account_partition_id)?.change !== 0">
									<Currency :amount="summary.partitionSummaries.get(partition.account_partition_id)?.change" mode="net_change" hideCurrency />
									&emsp13;
								</small>
								<span><Currency :amount="summary.partitionSummaries.get(partition.account_partition_id)?.endingBalance" mode="balance" /></span>
							</div>
						</small>
					</div>
				</div>
				<UpsertAccountForm v-if="state.upsertingAccount" :account="state.upsertingAccount || {}" :close="() => state.upsertingAccount = null" :onSave="createDelfi" />
				<button v-else @click="() => state.upsertingAccount = {}">Add Account</button>
			</div>
			<br />

			
			<div>
				<h3>Income</h3>
				<div>Total ...... <Currency :amount="state.summaryData.incomeSummary?.netChange || 0" mode="net_change" /></div>
				<div class="list">
					<div v-for="[schedule, {total, events}] of state.summaryData.incomeSummary?.eventsBySchedule.entries()" class="list-row">
						<template v-if="schedule !== 'none'" >
							<div class="transaction-main-line">
								{{ schedule.memo }}
								<Currency :amount="total" mode="transaction" />
							</div>
							{{ events.map(e => e.date.format('MMM D')).join(', ') }}
							&emsp;{{ accountStore.getAccountById(schedule.target_account_id)?.display_name }}
						</template>
					</div>
				</div>
			</div>
			<br />

			<div>
				<h3>Savings and Transfers</h3>
				<div class="list">
					<div v-for="[schedule, {total, events}] of state.summaryData.transferSummary?.eventsBySchedule.entries()" class="list-row">
						<template v-if="schedule !== 'none'" >
							<div class="transaction-main-line">
								{{ schedule.memo }}
								<Currency :amount="total" />
							</div>
							{{ events.map(e => e.date.format('MMM D')).join(', ') }}
							&emsp;{{ accountStore.getAccountById(schedule.origin_account_id)?.display_name }} → {{ accountStore.getAccountById(schedule.target_account_id)?.display_name }}
						</template>
					</div>
				</div>
			</div>
			<br />


			<UpsertPlannedTransactionForm v-if="state.upsertingPlannedTransaction" :plannedTransaction="state.upsertingPlannedTransaction || {}" :close="() => state.upsertingPlannedTransaction = null" :onSave="createDelfi" />
			<button v-else @click="() => state.upsertingPlannedTransaction = {}">Add Transaction</button>
			<br />
			<UpsertBudgetForm v-if="state.upsertingBudget" :budget="state.upsertingBudget || {}" :close="() => state.upsertingBudget = null" :onSave="createDelfi" />
			<button v-else @click="() => state.upsertingBudget = {}">Add Budget</button>

			<div>
				<h3>Spending</h3>
				Total spending: <Currency :amount="state.summaryData.spendingTotal" mode="transaction" />
				<br />
				<br />
				<template v-for="category of state.summaryData.spendingCategories">
					<div v-if="category.hasInfo">
						<b>{{ category.category.name }}</b>
						<template v-for="event of category.nonBudgetEvents">
							<div class="flex hover-show-trigger">
								<div class="flex-center">
									&nbsp;&nbsp;&nbsp;&nbsp;
									{{ event.transaction.memo }}
									<button class="hover-show" @click="() => state.upsertingPlannedTransaction = event.transaction.sourcePlannedTransaction">Edit</button>
								</div>
								&nbsp;......&nbsp;
								<Currency :amount="event.transaction.amount" mode="transaction" />
							</div>
						</template>
						<template v-for="budget of category.allBudgets">
							<div class="flex hover-show-trigger">
								<div class="flex-center">
									&nbsp;&nbsp;&nbsp;&nbsp;
									{{ budget.budget.name }}
									<button class="hover-show" @click="() => state.upsertingBudget = budget.budget">Edit</button>
								</div>
								&nbsp;......&nbsp;
								<Currency :amount="budget.budget.amount" mode="transaction" />
							</div>
						</template>
					</div>
				</template>
			</div>

			<br />
			
			<div>
				<h3>Transactions</h3>
				<div v-for="day of state.summaryData.timeline.periods">
					<template v-if="day.events.length > 0">
						<div :style="{ padding: '5px 8px', marginTop: '8px'}">{{ day.start }}</div>
						<div class="list">
							<div v-for="event of day.events" class="list-row">
								<div class="transaction-main-line">
									{{ event.transaction.memo }}
									<Currency :amount="event.transaction.amount" mode="transaction" />
								</div>
								<!-- {{ accountStore.getAccountById(event.transaction.target_account_id).display_name }} -->
							</div>
						</div>
					</template>
				</div>
			</div>
		</div>

		<div>
			<!-- <div style="padding: 20px; background: #ebe6fa" />
			<div style="padding: 20px; background: #BE47FB" />
			<div style="padding: 20px; background: #9A39E7" />
			<div style="padding: 20px; background: #861ED7" />
			<div style="padding: 20px; background: #5EFFFF" />
			<div style="padding: 20px; background: #53E1F9" />
			<div style="padding: 20px; background: #50CEFF" /> -->

			<br />
			<!-- sea foam -->
			<div style="padding: 20px; background: #e3fafe" />
			<div style="padding: 20px; background: #c5f4fd" />
			<div style="padding: 20px; background: #a5eefc" />
			<div style="padding: 20px; background: #81e8fb" />
			<div style="padding: 20px; background: #53e1f9" />
			<div style="padding: 20px; background: #3cb0c4" />
			<div style="padding: 20px; background: #10798b" />
			<div style="padding: 20px; background: #03414c" />

			<br />
			<!-- purple 2 -->
			<div style="padding: 20px; background: #f3deff" />
			<div style="padding: 20px; background: #e6bdff" />
			<div style="padding: 20px; background: #d99aff" />
			<div style="padding: 20px; background: #cc75fe" />
			<div style="padding: 20px; background: #be47fb" />
			<div style="padding: 20px; background: #8c32ba" />
			<div style="padding: 20px; background: #5e1f7e" />
			<div style="padding: 20px; background: #330d46" />

			<br />
			<!-- green -->
			<div style="padding: 20px; background: #e0f6e8" />
			<div style="padding: 20px; background: #c0ecd1" />
			<div style="padding: 20px; background: #9ee2ba" />
			<div style="padding: 20px; background: #79d8a3" />
			<div style="padding: 20px; background: #4ccd8d" />
			<div style="padding: 20px; background: #369867" />
			<div style="padding: 20px; background: #226644" />
			<div style="padding: 20px; background: #0f3823" />

			<!-- green 2 -->
			<!-- <div style="padding: 20px; background: #dcf4ea" />
			<div style="padding: 20px; background: #b8e8d5" />
			<div style="padding: 20px; background: #91ddc0" />
			<div style="padding: 20px; background: #65d0ac" />
			<div style="padding: 20px; background: #1cc498" />
			<div style="padding: 20px; background: #129170" />
			<div style="padding: 20px; background: #08614a" />
			<div style="padding: 20px; background: #023527" /> -->

			<br />
			<!-- red -->
			<div style="padding: 20px; background: #fad7da" />
			<div style="padding: 20px; background: #f1b0b6" />
			<div style="padding: 20px; background: #e68793" />
			<div style="padding: 20px; background: #d85d71" />
			<div style="padding: 20px; background: #c72850" />
			<div style="padding: 20px; background: #931b39" />
			<div style="padding: 20px; background: #620f24" />
			<div style="padding: 20px; background: #360410" />

			<!-- purple 1 -->
			<!-- <div style="padding: 20px; background: #f2ebfd" />
			<div style="padding: 20px; background: #ccb0f4" />
			<div style="padding: 20px; background: #b487ec" />
			<div style="padding: 20px; background: #9c5be2" />
			<div style="padding: 20px; background: #861ed7" />
			<div style="padding: 20px; background: #62139f" />
			<div style="padding: 20px; background: #40096b" />
			<div style="padding: 20px; background: #21033b" /> -->

			<!-- clozd -->
			<!-- <div style="padding: 20px; background: #EBE7FF" />
			<div style="padding: 20px; background: #DAD1FF" />
			<div style="padding: 20px; background: #BAA2FF" />
			<div style="padding: 20px; background: #865CFF" />
			<div style="padding: 20px; background: #7031F5" />
			<div style="padding: 20px; background: #471FBA" />
			<div style="padding: 20px; background: #2E1280" />
			<div style="padding: 20px; background: #170047" /> -->


			<!-- <div style="padding: 20px; background: #E6FDF9" />
			<div style="padding: 20px; background: #B4FFF3" />
			<div style="padding: 20px; background: #5DEEDF" />
			<div style="padding: 20px; background: #09D4CB" />
			<div style="padding: 20px; background: #0AB2AC" />
			<div style="padding: 20px; background: #007E88" />
			<div style="padding: 20px; background: #005B6F" />
			<div style="padding: 20px; background: #00323D" /> -->

			<br />
			<div style="padding: 20px; background: #F8F9FA" />
			<div style="padding: 20px; background: #F4F5F6" />
			<div style="padding: 20px; background: #F0F1F2" />
			<div style="padding: 20px; background: #E1E3E5" />
			<div style="padding: 20px; background: #D8DADE" />
			<div style="padding: 20px; background: #C0C3C8" />
			<div style="padding: 20px; background: #ACB0B6" />
			<div style="padding: 20px; background: #90959B" />
			<div style="padding: 20px; background: #798087" />
			<div style="padding: 20px; background: #565F66" />
			<div style="padding: 20px; background: #363F44" />
			<div style="padding: 20px; background: #1F2528" />
			<div style="padding: 20px; background: #101516" />
			<br />
			<div style="color: #fff; padding: 10px; background: #FFB9AA">red3</div>
			<div style="color: #fff; padding: 10px; background: #F14035">red4</div>
			<div style="color: #fff; padding: 10px; background: #AF0015">red6</div>
			<div style="color: #fff; padding: 10px; background: #FEAD62">orange3</div>
			<div style="color: #fff; padding: 10px; background: #EB7319">orange4</div>
			<div style="color: #fff; padding: 10px; background: #C94C00">orange5</div>
			<div style="color: #fff; padding: 10px; background: #F8C220">yellow4</div>
			<div style="color: #fff; padding: 10px; background: #CF9500">yellow5</div>
			<div style="color: #fff; padding: 10px; background: #996504">yellow6</div>
			<div style="color: #fff; padding: 10px; background: #AED70D">#AED70D</div>
			<div style="color: #fff; padding: 10px; background: #7CB100">#7CB100</div>
			<div style="color: #fff; padding: 10px; background: #348500">#348500</div>
			<div style="color: #fff; padding: 10px; background: #09D4CB">teal4</div>
			<div style="color: #fff; padding: 10px; background: #0AB2AC">teal5</div>
			<div style="color: #fff; padding: 10px; background: #007E88">teal6</div>
			<div style="color: #fff; padding: 10px; background: #7DC9FF">blue3</div>
			<div style="color: #fff; padding: 10px; background: #14A6F8">blue4</div>
			<div style="color: #fff; padding: 10px; background: #274FDB">blue6</div>
			<div style="color: #fff; padding: 10px; background: #865CFF">violet4</div>
			<div style="color: #fff; padding: 10px; background: #7031F5">violet5</div>
			<div style="color: #fff; padding: 10px; background: #471FBA">violet6</div>
			<div style="color: #fff; padding: 10px; background: #E55EC8">pink4</div>
			<div style="color: #fff; padding: 10px; background: #C50099">pink5</div>
			<div style="color: #fff; padding: 10px; background: #95007D">pink6</div>
		</div>
		
	</main>
</template>

<style scoped>
.list {
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.list-row {
	padding: 12px 16px;
	background: #fff;
}

.list-row:not(:last-child) {
	border-bottom: 1px solid #eee;
}

.transaction-main-line {
	display: flex;
	justify-content: space-between;
	gap: 12px;
	font-weight: 500;
}

</style>
