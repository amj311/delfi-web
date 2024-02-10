<script setup lang="ts">
import { useDelfiStore } from '@/stores/delfi.store';
import { useAccountStore } from '@/stores/account.store';
import { computed, reactive, ref } from 'vue';
import { useTransactionScheduleStore } from '@/stores/transactionSchedule.store';
import Forecast from '../../delfi-core/models/Forecast';
import { type DelfiDate, date} from '../../delfi-core/utils/dateUtils';
import { budgets, customCategories } from '../stores/myData';
import Currency from '@/components/Currency.vue';

const delfiStore = useDelfiStore();
const accountStore = useAccountStore();
const transactionStore = useTransactionScheduleStore();

const state = reactive({
	loading: false,
	viewingMonth: <DelfiDate><unknown>null,
	forecast: <Forecast><unknown>null,
});

(async () => {
	state.loading = true;
	state.viewingMonth = date(date().startOf('month'));
	
	await accountStore.loadAccounts();
	await transactionStore.loadTransactionSchedules();

	delfiStore.initDelfi({
		accounts: accountStore.accounts,
		transactionSchedules: delfiStore.translateTransactionSchedules(transactionStore.transactionSchedules),
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
				<div v-for="summary of monthData.accountSummaries">
					{{ summary.account.custom_name || account.external_name }} ......
					<Currency :amount="summary.endingBalance()" mode="balance" />
					<span v-if="summary.change() !== 0">
						(<Currency :amount="summary.change()" mode="net_change" />)
					</span>
					<template v-for="partition of summary.account.partitions">
						<div>&nbsp;&nbsp;&nbsp;&nbsp;{{partition.name}} ......
							<Currency :amount="summary.endingBalance(partition.partition_id)" mode="balance" />
							<span v-if="summary.change(partition.partition_id) !== 0">
								(<Currency :amount="summary.change(partition.partition_id)" mode="net_change" />)
							</span>
						</div>
					</template>
				</div>
				<div>Net Growth ...... <Currency :amount="monthData.timeline.change('total')" mode="net_change" /></div>
			</div>
			<br />

			<div>
				<h3>Income</h3>
				<div v-for="[schedule, events] of monthData.incomeSummary?.eventsBySchedule.entries()">
					<template v-if="schedule !== 'none'" >
						{{ schedule.memo }} ...... <Currency :amount="schedule.amount" mode="transaction" />
						<br/>
						{{ events.map(e => e.date.format('MMM D')).join(', ') }}
					</template>
				</div>
				<div>Total ...... <Currency :amount="monthData.incomeSummary?.netChange || 0" mode="net_change" /></div>
			</div>
			<br />

			<div>
				<h3>Savings and Transfers</h3>
				<div v-for="[schedule, events] of monthData.transferSummary?.eventsBySchedule.entries()">
					<template v-if="schedule !== 'none'" >
						{{ schedule.memo }} ...... <Currency :amount="schedule.amount" />
						<br/>
						{{ accountStore.getAccountById(schedule.originAccount || '').custom_name }} → {{ accountStore.getAccountById(schedule.targetAccount).custom_name }}
						<br />
						{{ events.map(e => e.date.format('MMM D')).join(', ') }}
					</template>
				</div>
			</div>
			<br />


			<div>
				<h3>Spending</h3>
				Total spending: <Currency :amount="monthData.timeline.change('expense')" mode="transaction" />
				<template v-for="category of monthData.spendingCategories">
					<div
						v-if="category.hasInfo">
						{{ category.category.name }}
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
						<div>{{ day.start }}</div>
						<div v-for="event of day.events">
							{{ event.transaction.memo }} ...... <Currency :amount="event.transaction.amount" mode="transaction" />
						</div>
					</template>
				</div>
			</div>
		</div>
		
	</main>
</template>
../../delfi-core/services/Transaction