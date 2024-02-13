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
							<div class="text-semibold">{{ summary.account.custom_name || summary.account.external_name }}</div>
							<div class="flex-center">
								<small v-if="summary.change() !== 0">
									<Currency :amount="summary.change()" mode="net_change" hideCurrency />
									&emsp13;
								</small>
								<span class="text-semibold"><Currency :amount="summary.endingBalance()" mode="balance" /></span>
							</div>
						</div>
						<small v-for="partition of summary.account.partitions" class="flex-between">
							&emsp13;- {{partition.name}}
							<div class="flex-center">
								<small v-if="summary.change(partition.partition_id) !== 0">
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
					<div v-for="[schedule, {total, events}] of monthData.incomeSummary?.eventsBySchedule.entries()" class="list-row">
						<template v-if="schedule !== 'none'" >
							<div class="transaction-main-line">
								{{ schedule.memo }}
								<Currency :amount="total" mode="transaction" />
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
					<div v-for="[schedule, {total, events}] of monthData.transferSummary?.eventsBySchedule.entries()" class="list-row">
						<template v-if="schedule !== 'none'" >
							<div class="transaction-main-line">
								{{ schedule.memo }}
								<Currency :amount="total" />
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
