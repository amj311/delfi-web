<script setup lang="ts">
import { useDelfiStore } from '@/stores/delfi.store';
import { useAccountStore } from '@/stores/account.store';
import { computed, reactive, ref } from 'vue';
import { useTransactionScheduleStore } from '@/stores/transactionSchedule.store';
import Forecast from '../../delfi-core/models/Forecast';
import Accumulator from '../../delfi-core/models/Accumulator';
import { AccountAccumulator } from '../../delfi-core/models/Account';
import { BudgetAccumulator } from '../../delfi-core/models/Budget';
import { CategorySummary } from '../../delfi-core/models/Category'
import TransactionService, { type TransactionTrigger } from '../../delfi-core/services/transactionService';
import BudgetService from '../../delfi-core/services/BudgetService';
import { type DelfiDate, date} from '../../delfi-core/utils/dateUtils';
import { budgets, nestedCategories, flatCategoriesMap } from '../stores/myData';
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

	const accumulators: Accumulator[] = [];
	accumulators.push(new Accumulator(
		'total',
		accountStore.accounts.reduce((balance, a) => balance + a.current_balance, 0),
		[{
			operator: '*'
		}]
	));
	accumulators.push(new Accumulator(
		'income',
		0,
		[{
			property: 'type',
			operator: 'eq',
			operand: 'income',
		}]
	));
	accumulators.push(new Accumulator(
		'expense',
		0,
		[{
			property: 'type',
			operator: 'eq',
			operand: 'expense',
		}]
	));
	for (const account of accountStore.accounts) {
		const acc = new AccountAccumulator(account, state.viewingMonth);
		accumulators.push(acc);
	};

	// Prepare categories w/ accumulators
	for (const categoryId in flatCategoriesMap) {
		const accumulator = new Accumulator(
			'cat_' + categoryId,
			0,
			[{
				property: 'categoryId',
				operator: 'eq',
				operand: categoryId
			}]
		);
		accumulators.push(accumulator);
	}

	// Prepare budgets w/ categories
	for (const budget of budgets) {
		const accumulator = BudgetService.createBudgetAccumulator(budget);
		accumulators.push(accumulator);
	};

	// Put everything in the forecast
	state.forecast = new Forecast({
		accumulators,
		transactionSchedules: delfiStore.translateTransactionSchedules(
			transactionStore.transactionSchedules.filter(s => s.recurrenceType === 'schedule')
		),
		transactionTriggers: delfiStore.translateTransactionSchedules(
			transactionStore.transactionSchedules.filter(s => s.recurrenceType === 'trigger')
		) as unknown as TransactionTrigger[],
		start: date(date().startOf('month')),
		end: date(date().endOf('month').add(5, 'months')),
	});
	state.loading = false;
})();

const monthData = computed(() => {
	if (!state.viewingMonth || !state.forecast) {
		return null;
	}
	const monthStart = date(state.viewingMonth);
	const monthEnd = date(state.viewingMonth.add(1, 'month').subtract(1, 'day'));
		
	const transferSchedules = transactionStore.transactionSchedules.filter(s => s.recurrenceType === 'schedule' && s.type === 'transfer');
	const transfersAndDates = transferSchedules.map(schedule => ({
		schedule,
		dates: schedule.schedule.getOccurrencesBetween(monthStart, monthEnd),
	}));

	const incomeSchedules = transactionStore.transactionSchedules.filter(s => s.recurrenceType === 'schedule' && s.type === 'income');
	const incomesAndDates = incomeSchedules.map(schedule => ({
		schedule,
		dates: schedule.schedule.getOccurrencesBetween(monthStart, monthEnd),
	}));

	const timeline = state.forecast.getTimeline(monthStart, monthEnd, 'day');

	const accountSummaries = accountStore.accounts.map(account => (
		(state.forecast.accumulatorMap[account.account_id] as AccountAccumulator).createSummary(monthStart, monthEnd)
	));	

	const categorySummaries = nestedCategories.map(category => new CategorySummary(
		monthStart,
		monthEnd,
		category,
		timeline.accumulatorEvents['cat_' + category.name],
		budgets.filter(b => b.categoryId === category.name).map(b => state.forecast.accumulatorMap[b.budget_id] as BudgetAccumulator),
		category.children.map(child => new CategorySummary(
			monthStart,
			monthEnd,
			child,
			timeline.accumulatorEvents['cat_' + child.name],
			budgets.filter(b => b.categoryId === child.name).map(b => state.forecast.accumulatorMap[b.budget_id] as BudgetAccumulator),
		)),
	));

	return {
		timeline,
		accountSummaries,
		categorySummaries,
		transfersAndDates,
		incomesAndDates,
	};
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
				<div v-for="income of monthData.incomesAndDates">
					{{ income.schedule.memo }} ...... {{ income.schedule.amount }}
					<br />
					{{ income.dates.map(d => d.format('MMM D')).join(', ') }}
				</div>
				<div>Total ...... {{ monthData.timeline.endingBalance('income') }}</div>
			</div>
			<br />

			<div>
				<h3>Savings and Transfers</h3>
				<div v-for="transfer of monthData.transfersAndDates">
					{{ transfer.schedule.memo }} ...... {{ transfer.schedule.amount }}
					<br/>
					{{ accountStore.getAccountById(transfer.schedule.originAccount || '').custom_name }} → {{ accountStore.getAccountById(transfer.schedule.targetAccount).custom_name }}
					<br />
					{{ transfer.dates.map(d => d.format('MMM D')).join(', ') }}
				</div>
			</div>
			<br />


			<div>
				<h3>Spending</h3>
				Total spending: <Currency :amount="monthData.timeline.endingBalance('expense')" mode="transaction" />
				<template v-for="category of monthData.categorySummaries">
					<div
						v-if="category.hasInfo && !['Income'].includes(category.category.name)">
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
