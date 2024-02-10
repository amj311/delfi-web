<script setup lang="ts">
import { useDelfiStore } from '@/stores/delfi.store';
import { useAccountStore } from '@/stores/account.store';
import { computed, reactive, ref } from 'vue';
import { usePlannedTransactionStore } from '@/stores/plannedTransaction.store';
import Forecast from '../../delfi-core/models/Forecast';
import { type DelfiDate, date} from '../../delfi-core/utils/dateUtils';
import { budgets, customCategories } from '../stores/myData';
import Currency from '@/components/Currency.vue';

const delfiStore = useDelfiStore();
const accountStore = useAccountStore();
const transactionStore = usePlannedTransactionStore();

const state = reactive({
	loading: false,
	viewingMonth: <DelfiDate><unknown>null,
	forecast: <Forecast><unknown>null,
});

(async () => {
	state.loading = true;
	state.viewingMonth = date(date().startOf('month'));
	
	await accountStore.loadAccounts();
	await transactionStore.loadPlannedTransactions();

	delfiStore.initDelfi({
		accounts: accountStore.accounts,
		plannedTransactions: delfiStore.translatePlannedTransactions(transactionStore.plannedTransactions),
		budgets: budgets,
		userCategories: customCategories,
	})
	state.forecast = await delfiStore.delfi.createFullForecast(state.viewingMonth, date(state.viewingMonth.add(1, 'year')));
	state.loading = false;
})();

const monthData = computed(() => {
	if (!state.viewingMonth || !delfiStore.delfi?.forecast) {
		return null;
	}
	const summary = delfiStore.delfi.getMonthSummary(state.viewingMonth);
	return summary;
});

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
};

const goBack = () => {
	if (!canGoBack.value) {
		return;
	}
	if (!state.viewingMonth) {
		return;
	}
	state.viewingMonth = date(state.viewingMonth.subtract(1, 'month'));
};

</script>

<template>
	<main>
		<div v-if="state.loading">Loading...</div>

		<h2>Monthly Budget</h2>
		<div style="display: flex; justify-content: space-between">
			<a @click="goBack()">Back</a>
			<span>{{ state.viewingMonth?.format('MMMM YYYY') }}</span>
			<a @click="goForward()">Forward</a>
		</div>
		<br />

		<div v-if="monthData">
			<div>
				<h3>Accounts</h3>
				<div>Net Growth ...... <Currency :amount="monthData.timeline.change('total')" mode="net_change" /></div>
				<div class="list">
					<div v-for="summary of monthData.accountSummaries" class="list-row">
						<div class="flex-between">
							<div class="text-semibold">{{ summary.account.custom_name || account.external_name }}</div>
							<div class="flex-center">
								<small v-if="summary.change() !== 0">
									<Currency :amount="summary.change()" mode="net_change" hideCurrency />
									&emsp13;
								</small>
								<span class="text-semibold"><Currency :amount="summary.endingBalance()" mode="balance" /></span>
							</div>
						</div>
						<small v-for="partition of summary.account.partitions" class="flex-between">
							{{partition.name}}
							<div class="flex-center">
								<small v-if="summary.change() !== 0">
									<Currency :amount="summary.change(partition.partition_id)" mode="net_change" hideCurrency />
									&emsp13;
								</small>
								<span><Currency :amount="summary.endingBalance(partition.partition_id)" mode="balance" /></span>
							</div>
						</small>
					</div>
				</div>
			</div>
			<br />

			
			<div>
				<h3>Income</h3>
				<div>Total ...... <Currency :amount="monthData.incomeSummary?.netChange || 0" mode="net_change" /></div>
				<div class="list">
					<div v-for="[schedule, events] of monthData.incomeSummary?.eventsBySchedule.entries()" class="list-row">
						<template v-if="schedule !== 'none'" >
							<div class="transaction-main-line">
								{{ schedule.memo }}
								<Currency :amount="schedule.amount" mode="transaction" />
							</div>
							{{ events.map(e => e.date.format('MMM D')).join(', ') }}
							&emsp;{{ accountStore.getAccountById(schedule.targetAccount).custom_name }}
						</template>
					</div>
				</div>
			</div>
			<br />

			<div>
				<h3>Savings and Transfers</h3>
				<div class="list">
					<div v-for="[schedule, events] of monthData.transferSummary?.eventsBySchedule.entries()" class="list-row">
						<template v-if="schedule !== 'none'" >
							<div class="transaction-main-line">
								{{ schedule.memo }}
								<Currency :amount="schedule.amount" />
							</div>
							{{ events.map(e => e.date.format('MMM D')).join(', ') }}
							&emsp;{{ accountStore.getAccountById(schedule.originAccount).custom_name }} → {{ accountStore.getAccountById(schedule.targetAccount).custom_name }}
						</template>
					</div>
				</div>
			</div>
			<br />


			<div>
				<h3>Spending</h3>
				Total spending: <Currency :amount="monthData.spendingTotal" mode="transaction" />
				<br />
				<br />
				<template v-for="category of monthData.spendingCategories">
					<div v-if="category.hasInfo">
						<b>{{ category.category.name }}</b>
						<template v-for="event of category.nonBudgetEvents">
							<div>&nbsp;&nbsp;&nbsp;&nbsp;{{ event.transaction.memo }} ...... <Currency :amount="event.transaction.amount" mode="transaction" /></div>
						</template>
						<template v-for="budget of category.allBudgets">
							<div>&nbsp;&nbsp;&nbsp;&nbsp;{{ budget.budget.name }} ...... <Currency :amount="-budget.budget.amount" mode="transaction" /></div>
						</template>
					</div>
				</template>
			</div>

			<br />
			
			<div>
				<h3>Transactions</h3>
				<div v-for="day of monthData.timeline.periods">
					<template v-if="day.events.length > 0">
						<div :style="{ padding: '5px 8px', marginTop: '8px'}">{{ day.start }}</div>
						<div class="list">
							<div v-for="event of day.events" class="list-row">
								<div class="transaction-main-line">
									{{ event.transaction.memo }}
									<Currency :amount="event.transaction.amount" mode="transaction" />
								</div>
								{{ accountStore.getAccountById(event.transaction.targetAccount).custom_name }}
							</div>
						</div>
					</template>
				</div>
			</div>
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
