<script setup lang="ts">
import { useDelfiStore } from '@/stores/delfi.store';
import { useAccountStore } from '@/stores/account.store';
import { computed, reactive, ref } from 'vue';
import { useTransactionScheduleStore } from '@/stores/transactionSchedule.store';
import dayjs, { Dayjs } from 'dayjs';
import VueApexCharts from "vue3-apexcharts";
import Forecast from '../../delfi-core/services/forecastService'
import Accumulator from '../../delfi-core/models/Accumulator';
import { date } from '../../delfi-core/utils/dateUtils';
import type { TransactionTrigger } from 'delfi-core/services/transactionService';

const delfiStore = useDelfiStore();
const accountStore = useAccountStore();
const transactionStore = useTransactionScheduleStore();


const state = reactive({
	loading: false,
	viewingMonth: <Dayjs><unknown>null,
	forecast: <Forecast><unknown>null,
});

(async () => {
	state.loading = true;
	await accountStore.loadAccounts();
	await transactionStore.loadTransactionSchedules();
	const accumulators: Accumulator[] = [];
	accumulators.push(new Accumulator(
		'total',
		accountStore.accounts.reduce((balance, a) => balance + a.current_balance, 0),
		[{
			operator: '*'
		}]
	));
	for (const account of accountStore.accounts) {
		accumulators.push(new Accumulator(
			'account_'+account.account_id,
			account.current_balance,
			[{
				property: 'targetAccount',
				operator: 'eq',
				operand: account.account_id
			}]
		))
	}
	state.forecast = new Forecast({
		accumulators,
		transactionSchedules: delfiStore.translateTransactionSchedules(
			transactionStore.transactionSchedules.filter(s => s.recurrenceType === 'schedule')
		),
		transactionTriggers: delfiStore.translateTransactionSchedules(
			transactionStore.transactionSchedules.filter(s => s.recurrenceType === 'trigger')
		) as unknown as TransactionTrigger[],
		start: date(dayjs().startOf('month')),
		end: date(dayjs().endOf('month').add(12, 'month')),
	});
	state.viewingMonth = dayjs().startOf('month');
	state.loading = false;
})();

const chartData = computed(() => {
	if (!state.viewingMonth) {
		return null;
	}
	const timeline = state.forecast.getTimeline(date(state.viewingMonth), date(state.viewingMonth.add(1, 'month').subtract(1, 'day')), 'day');
	console.log(timeline);
	// const startingBalances = Array.from(Object.values(timeline.startingBalances || {})).reduce((dict, account) => {
	// 	dict[account.id] = account;
	// 	return dict;
	// }, {});
	// const endingBalances = Array.from(Object.values(timeline.endingBalances || {}));
	// const accountSummary = endingBalances.map(account => ({
	// 	startingBalance: startingBalances[account.id].balance,
	// 	endingBalance: account.balance,
	// 	netChange: account.balance - startingBalances[account.id].balance,
	// }));

	// const series = Array.from(Object.values(timeline.startingBalances || {})).reduce((dict, account) => {
	// 	dict[account.id] = {
	// 		id: account.id,
	// 		name: account.name,
	// 		data: [],
	// 	};
	// 	return dict;
	// }, {});
	// timeline.points.forEach(point => {
	// 	Array.from(Object.values(series || {})).forEach(serie => {
	// 		serie.data.push([point.start, point.endingBalances?.[serie.id].balance || 0]);
	// 	})
	// });

	return {
		// initialNetValue: accountSummary.reduce((total, account) => total + account.startingBalance, 0),
		// finalNetValue: accountSummary.reduce((total, account) => total + account.endingBalance, 0),
		// netChange: accountSummary.reduce((total, account) => total + account.endingBalance, 0),
		timeline,
		// series,
	};
});

const canGoBack = computed(() => {
	if (!state.viewingMonth) {
		return false;
	}
	return state.viewingMonth.isAfter(dayjs().startOf('month'));
});

const goForward = () => {
	if (!state.viewingMonth) {
		return;
	}
	state.viewingMonth = state.viewingMonth.add(1, 'month');
};

const goBack = () => {
	if (!canGoBack.value) {
		return;
	}
	if (!state.viewingMonth) {
		return;
	}
	state.viewingMonth = state.viewingMonth.subtract(1, 'month');
};

</script>

<template>
	<main>
		<div v-if="state.loading">Loading...</div>

		<h2>Accounts</h2>
		<!-- <PlaidLink /> -->
		<div v-for="account of accountStore.accounts">
			{{ account.custom_name || account.external_name }}
		</div>
		<!-- 
		<br/>
		<div v-for="transaction of transactionStore.transactionSchedules">
			{{ transaction.memo }}
		</div> -->

		<br />
		<h2>Forecast</h2>
		<div><a @click="goBack()">Back</a> | <a @click="goForward()">Forward</a></div>
		<div>
			{{ state.viewingMonth?.format('MMMM YYYY') }}
			<div>{{ chartData?.timeline.endingBalance('total') }}</div>
			<div v-for="account of accountStore.accounts">
				{{ account.custom_name || account.external_name }} ...... {{ chartData?.timeline.endingBalance('account_' + account.account_id) }}
			</div>
		</div>
		<div>

			<!-- <VueApexCharts width="500" type="area" :options="{
				chart: {
					type: 'area',
					height: 350,
					stacked: true,
					events: {
						selection: function (chart, e) {
							console.log(new Date(e.xaxis.min))
						}
					},
				},
				colors: ['#008FFB', '#00E396', '#CED4DC'],
				dataLabels: {
					enabled: false
				},
				stroke: {
					curve: 'smooth'
				},
				fill: {
					type: 'solid',
				},
				legend: {
					position: 'top',
					horizontalAlign: 'left'
				},
				xaxis: {
					type: 'datetime',
				},
			}"
			:series="Object.values(chartData?.series || {})"
			/> -->

		</div>
		<div v-for="snapshot of chartData?.timeline.events">
			{{ snapshot.transaction.memo }} ...... {{ snapshot.transaction.amount > 0 ? '+' : '' }}{{ snapshot.transaction.amount }}
		</div>
	</main>
</template>
