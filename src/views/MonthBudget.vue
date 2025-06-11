<script setup lang="ts">
import { useDelfiStore } from '@/stores/delfi.store';
import { useAccountStore } from '@/stores/account.store';
import { computed, reactive, ref, onMounted, watch } from 'vue';
import { usePlannedTransactionStore } from '@/stores/plannedTransaction.store';
import Forecast from '../../delfi-core/models/Forecast';
import { type DelfiDate, date} from '../../delfi-core/utils/dateUtils';
import Currency from '@/components/Currency.vue';
// import { useBudgetStore } from '@/stores/budget.store';
import { useCategoryStore } from '@/stores/category.store';
import UpsertAccountForm from '@/components/UpsertAccountForm.vue';
import UpsertPlannedTransactionForm from '@/components/UpsertPlannedTransactionForm.vue';
import UpsertBudgetForm from '@/components/UpsertBudgetForm.vue';
import type { Delfi } from 'delfi-core';
import { EventFlag, type BudgetEvent, type TransactionBudget } from '../../delfi-core/models/Budget';
import type { Account } from 'delfi-core/models/Account';
import { useRoute, useRouter } from 'vue-router';

const delfiStore = useDelfiStore();
const accountStore = useAccountStore();
const transactionStore = usePlannedTransactionStore();
// const budgetStore = useBudgetStore();
const categoryStore = useCategoryStore();
const route = useRoute();
const router = useRouter();

const state = reactive({
	loading: true,
	viewingMonth: date().startOf('month'),
	forecast: <Forecast><unknown>null,
	upsertingAccount: <Partial<Account> | {} | null>null,
	upsertingPlannedTransaction: <TransactionBudget | {} | null>null,
	summaryData: <Awaited<ReturnType<Delfi["getMonthSummary"]>> | null>null,
});

async function getSummary(month: DelfiDate) {
	state.loading = true;
	if (!month || !delfiStore.delfi) {
		return null;
	}
	let summary = await delfiStore.delfi.getMonthSummary(month);
	state.loading = false;	
	return summary;
};

// Helper to format the month for URL
function formatMonthForUrl(monthDate: DelfiDate): string {
	return monthDate.format('YYYY-MM');
}

// Helper to parse month from URL
function parseMonthFromUrl(monthStr: string | null | undefined): DelfiDate {
	if (!monthStr) {
		return date().startOf('month');
	}
	
	const parsedDate = date(monthStr);
	return parsedDate.isValid() ? parsedDate.startOf('month') : date().startOf('month');
}

// Initialize the view based on route params
onMounted(async () => {
	const monthParam = route.params.month as string | undefined;
	state.viewingMonth = parseMonthFromUrl(monthParam);
	state.summaryData = await getSummary(state.viewingMonth);
	state.loading = false;
	
	// Update URL if it doesn't match the current month (happens when no month parameter was provided)
	if (!monthParam || monthParam !== formatMonthForUrl(state.viewingMonth)) {
		router.replace({
			name: 'Budget',
			params: { month: formatMonthForUrl(state.viewingMonth) }
		});
	}
});

// Watch for route changes to update the view
watch(() => route.params.month, async (newMonth) => {
	if (newMonth && newMonth !== formatMonthForUrl(state.viewingMonth)) {
		state.viewingMonth = parseMonthFromUrl(newMonth as string);
		state.summaryData = await getSummary(state.viewingMonth);
	}
}, { immediate: true });

const canGoBack = computed(() => {
	if (!state.viewingMonth) {
		return false;
	}
	return state.viewingMonth.isAfter(date().startOf('month'));
});

const canGoForward = computed(() => {
	if (!state.viewingMonth) {
		return false;
	}
	return state.viewingMonth.isBefore(date().add(5, 'years').subtract(1, 'month').startOf('month'));
});

const goForward = async () => {
	if (!canGoForward.value) {
		return;
	}
	if (!state.viewingMonth) {
		return;
	}
	const newMonth = date(state.viewingMonth.add(1, 'month'));
	router.push({
		name: 'Budget',
		params: { month: formatMonthForUrl(newMonth) }
	});
};

const goBack = async () => {
	if (!canGoBack.value) {
		return;
	}
	if (!state.viewingMonth) {
		return;
	}
	const newMonth = date(state.viewingMonth.subtract(1, 'month'));
	router.push({
		name: 'Budget',
		params: { month: formatMonthForUrl(newMonth) }
	});
};

// Get the events in order of days WITHOUT sorting because that is too slow
const dailyEvents = computed(() => {
	if (!state.summaryData || !state.summaryData.events) {
		return [];
	}
	const eventsByDay: Record<number, Array<BudgetEvent>> = Object.fromEntries(Array.from({ length: 31 }, (_, i) => [i + 1, []]));
	for (const event of state.summaryData.events) {
		const dayKey = event.date.date();
		if (!eventsByDay[dayKey]) {
			eventsByDay[dayKey] = [];
		}
		eventsByDay[dayKey].push(event);
	}
	return Object.entries(eventsByDay).flatMap(([, events]) => events);
})

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

		<div v-else-if="state.summaryData">
			<div>
				<h3>Accounts</h3>
				<div>Net Growth ...... <Currency :amount="state.summaryData.netGrowth" mode="net_change" /></div>
				<div class="list">
					<div v-for="summary of state.summaryData.accountSummaries" class="list-row">
						<div class="flex-between hover-show-trigger">
							<div class="flex-center gap-2">
								<div class="text-semibold">{{ accountStore.getAccountName(summary.account_id) }}</div>
								<button class="hover-show" @click="() => state.upsertingAccount = accountStore.getAccountById(summary.account_id)!">Edit</button>
							</div>
							<div class="flex-center">
								<small v-if="summary.netChange !== 0">
									<Currency :amount="summary.netChange" mode="net_change" hideCurrency />
									&emsp13;
								</small>
								<span class="text-semibold"><Currency :amount="summary.endingBalance" mode="balance" /></span>
							</div>
						</div>
						<small v-for="partition of summary.partitions" class="flex-between">
							&emsp13;- {{partition.name}}
							<div class="flex-center">
								<small v-if="partition.netChange !== 0">
									<Currency :amount="partition.netChange" mode="net_change" hideCurrency />
									&emsp13;
								</small>
								<span><Currency :amount="partition.endingBalance" mode="balance" /></span>
							</div>
						</small>
					</div>
				</div>
				<UpsertAccountForm v-if="state.upsertingAccount" :account="state.upsertingAccount || {}" :close="() => state.upsertingAccount = null" />
				<button v-else @click="() => state.upsertingAccount = {}">Add Account</button>
			</div>
			<br />

			
			<div>
				<h3>Income</h3>
				<div>Total ...... <Currency :amount="state.summaryData.incomeSummary?.netChange || 0" mode="net_change" /></div>
				<div class="list">
					<div v-for="{ budget, occurrences } of state.summaryData.incomeSummary?.allBudgetOccurrences" class="list-row">
						<div class="transaction-main-line">
							{{ budget.memo }}
							<Currency :amount="occurrences.reduce((acc, o) => acc + o.eventsInRange.reduce((acc, e) => acc + e.amount, 0), 0)" mode="transaction" />	
						</div>
						<small>
							{{ accountStore.getAccountName(budget.target_account_id) }}
						</small>
					</div>
				</div>
			</div>
			<br />

			<div>
				<h3>Savings and Transfers</h3>
				<div class="list">
					<div v-for="{ budget, eventsInRange } of state.summaryData.transferSummary?.occurrences" class="list-row">
						<div class="transaction-main-line">
							{{ budget.memo }}
							<Currency :amount="eventsInRange.filter(e => !e.flags.includes(EventFlag.TRANSFER_COPY)).reduce((acc, e) => acc + e.amount, 0)" /> <!-- counting both events cancels out -->
						</div>
						<small>{{ accountStore.getAccountName(budget.origin_account_id!) }} → {{ accountStore.getAccountName(budget.target_account_id) }}</small>
					</div>
				</div>
			</div>
			<br />


			<UpsertPlannedTransactionForm v-if="state.upsertingPlannedTransaction" :plannedTransaction="state.upsertingPlannedTransaction || {}" :close="() => state.upsertingPlannedTransaction = null" />
			<button v-else @click="() => state.upsertingPlannedTransaction = {}">Add Transaction</button>
			<br />
			<!-- <UpsertBudgetForm v-if="state.upsertingBudget" :budget="state.upsertingBudget || {}" :close="() => state.upsertingBudget = null" :onSave="createDelfi" />
			<button v-else @click="() => state.upsertingBudget = {}">Add Budget</button> -->

			<div>
				<h3>Spending</h3>
				Total spending: <Currency :amount="state.summaryData.spendingTotal" mode="transaction" />
				<br />
				<br />
				<template v-for="category of state.summaryData.spendingCategories">
					<div v-if="category.hasInfo">
						<b>{{ category.category.name }}</b>
						<template v-for="budgetOccurrences of category.allBudgetOccurrences">
							<div class="flex hover-show-trigger">
								<div class="flex-center">
									&nbsp;&nbsp;&nbsp;&nbsp;
									{{ budgetOccurrences.budget.memo }}
									<button class="hover-show" @click="() => state.upsertingPlannedTransaction = budgetOccurrences.budget!">Edit</button>
								</div>
								&nbsp;......&nbsp;
								<Currency :amount="budgetOccurrences.occurrences.reduce((acc, e) => acc + e.eventsInRange.reduce((acc, e) => acc + e.amount, 0), 0)" mode="transaction" />
							</div>
						</template>
					</div>
				</template>
			</div>

			<br />
			
			<div>
				<h3>Transactions</h3>
				<template v-for="(event, i) of dailyEvents">
					<div
						v-if="i === 0 || !dailyEvents[i - 1]?.date.isSame(event.date)"
						:style="{ padding: '5px 8px', marginTop: '8px'}"
					>
						{{ event.date }}
					</div>
					<div class="list">
						<div class="list-row" v-if="!event.flags.includes(EventFlag.TRANSFER_COPY)"> <!-- Don't show transfers twice! -->
							<div class="transaction-main-line">
								{{ event.memo }}
								<div style="flex-grow: 1"></div>
								<div style="display: flex; align-items: center; gap: 4px;">
									<span v-if="event.sourceBudget.transactionType === 'TRANSFER'">⇥</span>
									<Currency :amount="event.sourceBudget.transactionType === 'TRANSFER' ? Math.abs(event.amount) : event.amount" :mode="event.sourceBudget.transactionType === 'TRANSFER' ? undefined : 'transaction'"/>	
								</div>
							</div>
							<small>
								<span v-if="event.sourceBudget.origin_account_id">
									{{ accountStore.getAccountName(event.sourceBudget.origin_account_id) }}
									→
								</span>
								{{ accountStore.getAccountName(event.target_account_id) }}
							</small>
						</div>
					</div>
				</template>
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
			<div style="color: #fff; padding: 10px; background: #ff886e">red3</div>
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
	padding: 5px 16px;
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
