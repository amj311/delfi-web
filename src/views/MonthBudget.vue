<script setup lang="ts">
import { useDelfiStore } from '@/stores/delfi.store';
import { useAccountStore } from '@/stores/account.store';
import { computed, reactive, ref, onMounted, watch } from 'vue';
import Forecast from '../../delfi-core/models/Forecast';
import { type DelfiDate, date } from '../../delfi-core/utils/dateUtils';
import Currency from '@/components/Currency.vue';
import { useCategoryStore } from '@/stores/category.store';
import UpsertAccountForm from '@/components/UpsertAccountForm.vue';
import UpsertBudgetForm from '@/components/UpsertBudgetForm.vue';
import type { Delfi } from 'delfi-core/Delfi';
import { type Budget } from '../../delfi-core/models/Budget';
import type { Account } from 'delfi-core/models/Account';
import { useRoute, useRouter } from 'vue-router';
import { useGroupStore } from '@/stores/group.store';
import Icon from '@/components/Icon.vue';
import { colors } from 'delfi-core/utils/constants';
import CategoryAvatar from '@/components/CategoryAvatar.vue';
import { type AttributionEvent, type Transaction } from 'delfi-core/models/Transaction';
import TransactionDetailsDrawer from '@/components/TransactionDetailsDrawer.vue';
import Accordion from 'primevue/accordion';
import AccordionContent from 'primevue/accordioncontent';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import Knob from 'primevue/knob';
import AttributionAvatar from '@/components/AttributionAvatar.vue';

const delfiStore = useDelfiStore();
const accountStore = useAccountStore();
const groupStore = useGroupStore();
const route = useRoute();
const router = useRouter();

const state = reactive({
	loading: true,
	viewingMonth: date().startOf('month'),
	forecast: <Forecast>(<unknown>null),
	upsertingAccount: <Partial<Account> | {} | null>null,
	upsertingBudget: <Budget | {} | null>null,
	summaryData: <Awaited<ReturnType<Delfi['getMonthSummary']>> | null>null,
});

const viewingTransaction = ref<Transaction | null>(null);

async function getSummary(month: DelfiDate, silent = false) {
	state.loading = !silent && true;
	if (!month || !delfiStore.delfi) {
		return null;
	}
	let summary = await delfiStore.delfi.getMonthSummary(month);
	state.loading = false;
	return reactive(summary);
}

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

	// Update URL if it doesn't match the current month (happens when no month parameter was provided)
	if (!monthParam || monthParam !== formatMonthForUrl(state.viewingMonth)) {
		router.replace({
			name: 'Budget',
			params: { month: formatMonthForUrl(state.viewingMonth) },
		});
	}

	state.summaryData = await getSummary(state.viewingMonth);
});

// Watch for route changes to update the view
watch(
	() => route.params.month,
	async (newMonth) => {
		if (newMonth && newMonth !== formatMonthForUrl(state.viewingMonth)) {
			state.viewingMonth = parseMonthFromUrl(newMonth as string);
			state.summaryData = await getSummary(state.viewingMonth);
		}
	},
);

watch(
	() => delfiStore.reComputed,
	async () => {
		state.summaryData = await getSummary(state.viewingMonth, true);
	}
);

const canGoBack = computed(() => {
	if (!state.viewingMonth) {
		return false;
	}
	return state.viewingMonth.isAfter(delfiStore.delfi.start);
});

const canGoForward = computed(() => {
	if (!state.viewingMonth) {
		return false;
	}
	return state.viewingMonth.isBefore(delfiStore.delfi.end.subtract(1, 'month'));
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
		params: { month: formatMonthForUrl(newMonth) },
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
		params: { month: formatMonthForUrl(newMonth) },
	});
};

// Get the events in order of days WITHOUT sorting because that is too slow
const dailyEvents = computed(() => {
	if (!state.summaryData || !state.summaryData.attributionEvents) {
		return [];
	}
	const eventsByDay: Record<number, Array<AttributionEvent>> = Object.fromEntries(
		Array.from({ length: 31 }, (_, i) => [i + 1, []])
	);
	for (const event of state.summaryData.attributionEvents) {
		const dayKey = event.date.date();
		if (!eventsByDay[dayKey]) {
			eventsByDay[dayKey] = [];
		}
		eventsByDay[dayKey].push(event);
	}
	return Object.entries(eventsByDay).flatMap(([, events]) =>
		events.sort((a, b) => a.sourceTransaction.date_order?.localeCompare(b.sourceTransaction.date_order || '') || 0)
	);
});

function budgetProgress(budgetSummary) {
	const res = {
		percent: 0,
		dialPercent: 0, // modified to render within a dial component
		pace: 0,
		color: colors.lime2,
	};
	if (!budgetSummary.tally.budgetedNet) {
		res.percent = 101;
		res.pace = 0;
	} else {
		// allow the budget target to be either positive or negative
		// compute percentages with the absolute value, then adjust the sign if needed
		const budgetedNet = Math.abs(budgetSummary.tally.budgetedNet);
		const attributedNet = Math.abs(budgetSummary.tally.attributedNet);
		res.percent = (attributedNet / budgetedNet) * 100;
		// If the spent is NOT the same sign as the budgeted, use the sign to show it in the opposite direction
		if (Math.sign(budgetSummary.tally.budgetedNet) !== Math.sign(budgetSummary.tally.attributedNet)) {
			res.percent = -res.percent;
		}
		res.pace = budgetSummary.tally.budgetedNet > 0 ? attributedNet / budgetedNet : 0;
	}
	res.dialPercent = Math.min(Math.abs(res.percent), 101);
	// determine color. Green = good pace. Yellow = over pace. Red = over max.
	if (res.percent > 100) {
		res.color = colors.cherry2;
	}
	// else if (res.percent > res.percent) {
	// 	res.color = colors.yellow2;
	// }
	else {
		res.color = colors.lime2;
	}
	return res;
}
</script>

<template>
	<main>
		<div style="display: flex; justify-content: space-between; align-items: center">
			<h2>Monthly Budget</h2>
		</div>
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
				<div>
					Net Growth ......
					<Currency :amount="state.summaryData.netGrowth" mode="net_change" />
				</div>
				<div class="list">
					<div v-for="summary of state.summaryData.accountSummaries" class="list-row">
						<div class="flex hover-show-trigger">
							<div class="flex gap-2">
								<div class="text-semibold">
									{{ accountStore.getAccountName(summary.account_id) }}
								</div>
								<button
									class="hover-show"
									@click="() => state.upsertingAccount = accountStore.getAccountById(summary.account_id)!"
								>
									Edit
								</button>
							</div>
							<div class="flex-grow-1"></div>
							<div class="flex align-items-center">
								<small v-if="summary.netChange !== 0">
									<Currency :amount="summary.netChange" mode="net_change" hideCurrency />
									&emsp13;
								</small>
								<span class="text-semibold"
									><Currency :amount="summary.endingBalance" mode="balance"
								/></span>
							</div>
						</div>
						<small v-for="partition of summary.partitions" class="flex align-items-center">
							&emsp13;- {{ partition.name }}
							<div class="flex-grow-1"></div>
							<div class="flex align-items-center">
								<small v-if="partition.netChange !== 0">
									<Currency :amount="partition.netChange" mode="net_change" hideCurrency />
									&emsp13;
								</small>
								<span><Currency :amount="partition.endingBalance" mode="balance" /></span>
							</div>
						</small>
					</div>
				</div>
				<UpsertAccountForm
					v-if="state.upsertingAccount"
					:account="state.upsertingAccount || {}"
					:close="() => (state.upsertingAccount = null)"
				/>
				<button v-else @click="() => (state.upsertingAccount = {})">Add Account</button>
			</div>
			<br />

			<div>
				<h3>Income</h3>
				<div>
					Total ......
					<Currency :amount="state.summaryData.incomeSummary?.tally.budgetedNet || 0" mode="net_change" />
				</div>
				<div class="list">
					<div
						v-for="{ budget, budgetEvents } of state.summaryData.incomeSummary?.tally.budgetSnapshots"
						class="list-row"
					>
						<div class="transaction-main-line">
							{{ budget.memo }}
							<Currency :amount="budgetEvents.reduce((acc, o) => acc + o.amount, 0)" mode="transaction" />
						</div>
						<small>
							{{ accountStore.getAccountName(budget.account_id) }}
						</small>
					</div>
				</div>
			</div>
			<br />

			<div>
				<h3>Savings and Transfers</h3>
				<div class="list">
					<div
						v-for="budgetEvent of state.summaryData.transferSummary.tally.budgetEventsWithoutTransferCopies"
						class="list-row"
					>
						<div class="transaction-main-line">
							{{ budgetEvent.displayName }}
							<Currency :amount="budgetEvent.amount" />
						</div>
						<small>
							{{ accountStore.getAccountName(budgetEvent.sourceBudget.origin_account_id!) }}
							→
							{{ accountStore.getAccountName(budgetEvent.account_id) }}
						</small>
					</div>
				</div>
			</div>
			<br />

			<UpsertBudgetForm
				v-if="state.upsertingBudget"
				:budget="state.upsertingBudget || {}"
				:close="() => (state.upsertingBudget = null)"
			/>
			<button v-else @click="() => (state.upsertingBudget = {})">Add Transaction</button>
			<br />
			<!-- <UpsertBudgetForm v-if="state.upsertingBudget" :budget="state.upsertingBudget || {}" :close="() => state.upsertingBudget = null" :onSave="createDelfi" />
			<button v-else @click="() => state.upsertingBudget = {}">Add Budget</button> -->

			<br />
			<div>
				<div v-for="{ groupId, tally } of state.summaryData.groupSummaries" class="group-summary">
					<div class="title flex align-items-center gap-1">
						<Icon name="tag" fill :color="groupStore.getGroupById(groupId)?.color" />
						<b>{{ groupStore.getGroupById(groupId)?.name }}</b>
						<div class="flex-grow-1"></div>
						<div class="flex align-items-center gap-1">
							<Currency :amount="tally.attributedNet || 0" mode="transaction" class="text-semibold" />
						</div>
					</div>
					<div>
						<template v-for="budgetSnapshot of tally.budgetSnapshots">
							<template v-if="budgetSnapshot.tally.hasInfo">
								<div class="flex hover-show-trigger list-row gap-2">
									<div class="flex align-items-center gap-2">
										<i class="pi pi-wallet" />
										{{ budgetSnapshot.budget.memo }}
									</div>
									<div class="flex-grow-1"></div>
									<!-- <Currency :amount="budgetSnapshot.tally.attributedNet" mode="transaction" /> -->
								</div>
								<div
									v-for="childItem of budgetSnapshot.childItemEvents"
									class="list-row flex align-items-center gap-3"
								>
									<AttributionAvatar :categoryId="childItem.category_id" :size="1.9">
										<template #badge>
											<Icon name="checklist" />
										</template>
									</AttributionAvatar>
									<div class="flex flex-column w-full min-w-0">
										<div class="transaction-main-line">
											<div class="text-ellipsis w-full min-w-0">
												{{ childItem.displayName }}
											</div>
											<div style="flex-grow: 1"></div>
											<div style="display: flex; align-items: center; gap: 4px">
												<Currency :amount="childItem.rangeTally.attributedNet" mode="transaction" />
											</div>
											<Knob
												v-model="
													{
														percent:
															(childItem.rangeTally.attributedNet /
																childItem.rangeTally.budgetedNet) *
															100,
													}.percent
												"
												:min="0"
												:max="100"
												:size="20"
												:strokeWidth="20"
												:valueColor="colors.lime2"
												:readonly="true"
												:showValue="false"
											/>
										</div>
										<!-- <small>
											{{
												childItem.sourceBudget?.memo ||
												useCategoryStore().getCategoryById(childItem.category_id).name
											}}
											-
											{{ accountStore.getAccountName(childItem.account_id) }}
										</small> -->
									</div>
								</div>
								<template v-for="event of budgetSnapshot.notChildAttributions">
									<div
										class="list-row flex align-items-center gap-3"
										@click="viewingTransaction = event.sourceTransaction"
									>
										<AttributionAvatar :event="event" :size="1.9" />
										<div class="flex flex-column w-full min-w-0">
											<div class="transaction-main-line">
												<div class="text-ellipsis w-full min-w-0">
													{{ event.displayName }}
												</div>
												<div style="flex-grow: 1"></div>
												<div style="display: flex; align-items: center; gap: 4px">
													<Currency :amount="event.amount" mode="transaction" />
												</div>
											</div>
											<small>
												{{
													event.Budget?.memo ||
													useCategoryStore().getCategoryById(event.category_id).name
												}}
												-
												{{ accountStore.getAccountName(event.account_id) }}
											</small>
										</div>
									</div>
								</template>
							</template>
						</template>
						<div
							v-if="tally.unBudgetedAttributions.length > 0"
							class="flex align-items-center list-row gap-2"
						>
							<i class="pi pi-exclamation-triangle" />
							Unbudgeted
							<div class="flex-grow-1"></div>
							<!-- <Currency :amount="tally.unBudgetedNet" mode="transaction" /> -->
						</div>
						<div
							v-for="event of tally.unBudgetedAttributions"
							class="list-row flex align-items-center gap-3"
							@click="viewingTransaction = event.sourceTransaction"
						>
							<AttributionAvatar :event="event" :size="1.9" />
							<div class="flex flex-column w-full min-w-0">
								<div class="transaction-main-line">
									<div class="text-ellipsis w-full min-w-0">
										{{ event.displayName }}
									</div>
									<div style="flex-grow: 1"></div>
									<div style="display: flex; align-items: center; gap: 4px">
										<Currency :amount="event.amount" mode="transaction" />
									</div>
								</div>
								<small>
									{{
										event.Budget?.memo || useCategoryStore().getCategoryById(event.category_id).name
									}}
									-
									{{ accountStore.getAccountName(event.account_id) }}
								</small>
							</div>
						</div>
					</div>
				</div>
			</div>

			<br />
			<div>
				<h3>Spending</h3>
				Total spending:
				<Currency :amount="state.summaryData.spendingSummary.tally.attributedNet" mode="transaction" />
				&nbsp;/&nbsp;
				<Currency :amount="state.summaryData.spendingSummary.tally.budgetedNet" mode="transaction" />
				<br />
				<br />
				<Accordion multiple>
					<template v-for="(category, i) of state.summaryData.spendingSummary.categories">
						<AccordionPanel :value="i" v-if="category.tally.hasInfo">
							<AccordionHeader class="flex align-items-center gap-2">
								<CategoryAvatar :category="category.category" style="width: 2rem; height: 2rem" />
								<b>{{ category.category.name }}</b>
								<div class="flex-grow-1"></div>
								<Currency
									:amount="category.tally.attributedNet || 0"
									mode="transaction"
									class="text-semibold"
								/>
							</AccordionHeader>
							<AccordionContent>
								<template v-for="budgetSummary of category.tally.budgetSnapshots">
									<template v-if="budgetSummary.tally.hasInfo">
										<div class="flex hover-show-trigger list-row gap-2">
											<div class="flex align-items-center gap-2">
												<i class="pi pi-wallet" />
												{{ budgetSummary.budget.memo }}
												{{ budgetSummary.attributedEvents.length }}
												{{ budgetSummary.budgetEvents.length }}
											</div>
											<div class="flex-grow-1"></div>
											<!-- <Currency :amount="budgetSummary.tally.attributedNet" mode="transaction" /> -->
										</div>
										<div
											v-for="event of budgetSummary.tally.attributionEvents"
											class="list-row flex align-items-center gap-3"
											@click="viewingTransaction = event.sourceTransaction"
										>
											<AttributionAvatar :event="event" :size="1.9" />
											<div class="flex flex-column w-full min-w-0">
												<div class="transaction-main-line">
													<div class="text-ellipsis w-full min-w-0">
														{{ event.displayName }}
													</div>
													<div style="flex-grow: 1"></div>
													<div style="display: flex; align-items: center; gap: 4px">
														<Currency :amount="event.amount" mode="transaction" />
													</div>
												</div>
												<small>
													{{
														event.Budget?.memo ||
														useCategoryStore().getCategoryById(event.category_id).name
													}}
													-
													{{ accountStore.getAccountName(event.account_id) }}
												</small>
											</div>
										</div>
									</template>
								</template>
								<div
									v-if="category.tally.unBudgetedAttributions.length > 0"
									class="flex align-items-center list-row gap-2"
								>
									<i class="pi pi-exclamation-triangle" />
									Unbudgeted
									<div class="flex-grow-1"></div>
									<Currency :amount="category.tally.unBudgetedNet" mode="transaction" />
								</div>
								<div
									v-for="event of category.tally.unBudgetedAttributions"
									class="list-row flex align-items-center gap-3"
									@click="viewingTransaction = event.sourceTransaction"
								>
									<AttributionAvatar :event="event" :size="1.9" />
									<div class="flex flex-column w-full min-w-0">
										<div class="transaction-main-line">
											<div class="text-ellipsis w-full min-w-0">
												{{ event.displayName }}
											</div>
											<div style="flex-grow: 1"></div>
											<div style="display: flex; align-items: center; gap: 4px">
												<Currency :amount="event.amount" mode="transaction" />
											</div>
										</div>
										<small>
											{{
												event.Budget?.memo ||
												useCategoryStore().getCategoryById(event.category_id).name
											}}
											-
											{{ accountStore.getAccountName(event.account_id) }}
										</small>
									</div>
								</div>
							</AccordionContent>
						</AccordionPanel>
					</template>
				</Accordion>
			</div>

			<br />

			<div>
				<h3>Budgets</h3>
				<br />
				<Accordion multiple>
					<AccordionPanel value="0">
						<AccordionHeader class="flex align-items-center gap-2">
							<AttributionAvatar icon="question-circle" :size="2" />
							<b>Unbudgeted</b>
							<div class="flex-grow-1"></div>
							<Currency :amount="state.summaryData.allUnbudgeted.unBudgetedNet" mode="transaction" />
						</AccordionHeader>
						<AccordionContent>
							<template v-for="(event, i) of state.summaryData.allUnbudgeted.unBudgetedAttributions">
								<div
									class="list-row flex align-items-center gap-3"
									@click="viewingTransaction = event.sourceTransaction"
								>
									<div>
										<AttributionAvatar :event="event" :size="1.9" />
									</div>
									<div class="flex flex-column w-full min-w-0">
										<div class="transaction-main-line">
											<div class="text-ellipsis w-full min-w-0">
												{{ event.displayName }}
											</div>
											<div style="flex-grow: 1"></div>
											<div style="display: flex; align-items: center; gap: 4px">
												<Currency :amount="event.amount" mode="transaction" />
											</div>
										</div>
										<small>
											{{
												event.Budget?.memo ||
												useCategoryStore().getCategoryById(event.category_id).name
											}}
											-
											{{ accountStore.getAccountName(event.account_id) }}
										</small>
									</div>
								</div>
							</template>
						</AccordionContent>
					</AccordionPanel>
					<template v-for="budgetSnapshot of state.summaryData.spendingSummary.budgets">
						<AccordionPanel :value="budgetSnapshot.budget.budget_id">
							<AccordionHeader class="flex align-items-center gap-2">
								<AttributionAvatar :category="budgetSnapshot.budget.Category" :size="2" />
								<b>{{ budgetSnapshot.budget.memo }}</b>
								<div class="flex-grow-1"></div>
								<div class="flex align-items-center gap-2">
									<!-- <Currency
										:amount="budgetSummary.tally.attributedNet || 0"
										mode="transaction"
										class="text-semibold"
									/> -->
									{{ Math.floor(budgetProgress(budgetSnapshot).percent) }}%
									<Knob
										v-model="budgetProgress(budgetSnapshot).dialPercent"
										:min="0"
										:max="100"
										:size="25"
										:strokeWidth="15"
										:valueColor="budgetProgress(budgetSnapshot).color"
										:readonly="true"
										:showValue="false"
									/>
									<!-- <small>/</small>
									<small>
										<Currency
											:amount="budgetSummary.tally.budgetedNet || 0"
											mode="transaction"
										/>
									</small> -->
								</div>
							</AccordionHeader>
							<AccordionContent>
								<div
									v-for="childItem of budgetSnapshot.childItemEvents"
									class="list-row flex align-items-center gap-3"
								>
									<AttributionAvatar :categoryId="childItem.category_id" :size="1.9">
										<template #badge>
											<Icon name="checklist" />
										</template>
									</AttributionAvatar>
									<div class="flex flex-column w-full min-w-0">
										<div class="transaction-main-line">
											<div class="text-ellipsis w-full min-w-0">
												{{ childItem.displayName }}
											</div>
											<div style="flex-grow: 1"></div>
											<div style="display: flex; align-items: center; gap: 4px">
												<Currency :amount="childItem.rangeTally.attributedNet" mode="transaction" />
											</div>
											<Knob
												v-model="
													{
														percent:
															(childItem.rangeTally.attributedNet /
																childItem.rangeTally.budgetedNet) *
															100,
													}.percent
												"
												:min="0"
												:max="100"
												:size="20"
												:strokeWidth="20"
												:valueColor="colors.lime2"
												:readonly="true"
												:showValue="false"
											/>
										</div>
										<!-- <small>
											{{
												childItem.sourceBudget?.memo ||
												useCategoryStore().getCategoryById(childItem.category_id).name
											}}
											-
											{{ accountStore.getAccountName(childItem.account_id) }}
										</small> -->
									</div>
								</div>
								<template v-for="event of budgetSnapshot.notChildAttributions">
									<div
										class="list-row flex align-items-center gap-3"
										@click="viewingTransaction = event.sourceTransaction"
									>
										<AttributionAvatar :event="event" :size="1.9" />
										<div class="flex flex-column w-full min-w-0">
											<div class="transaction-main-line">
												<div class="text-ellipsis w-full min-w-0">
													{{ event.displayName }}
												</div>
												<div style="flex-grow: 1"></div>
												<div style="display: flex; align-items: center; gap: 4px">
													<Currency :amount="event.amount" mode="transaction" />
												</div>
											</div>
											<small>
												{{
													event.Budget?.memo ||
													useCategoryStore().getCategoryById(event.category_id).name
												}}
												-
												{{ accountStore.getAccountName(event.account_id) }}
											</small>
										</div>
									</div>
								</template>
							</AccordionContent>
						</AccordionPanel>
					</template>
				</Accordion>
			</div>

			<br />

			<div>
				<h3>Transactions</h3>
				<template v-for="(event, i) of dailyEvents">
					<h4
						v-if="i === 0 || !dailyEvents[i - 1]?.date.isSame(event.date)"
						:style="{
							padding: '8px 8px',
							marginTop: '8px',
							position: 'sticky',
							top: '0',
							backgroundColor: '#ffff',
							zIndex: 1,
							marginLeft: '-5px',
							marginRight: '-5px',
						}"
					>
						{{ event.date.formatFull() }}
					</h4>
					<div class="list">
						<div
							class="list-row flex align-items-center gap-3"
							@click="viewingTransaction = event.sourceTransaction"
						>
							<div>
								<AttributionAvatar :event="event" style="width: 2.5rem; font-size: 1.2rem" />
							</div>
							<div class="flex flex-column w-full min-w-0">
								<div class="transaction-main-line">
									<div class="text-ellipsis w-full min-w-0">
										{{ event.displayName }}
									</div>
									<div style="flex-grow: 1"></div>
									<div style="display: flex; align-items: center; gap: 4px">
										<Currency :amount="event.amount" mode="transaction" />
									</div>
								</div>
								<small>
									{{
										event.Budget?.memo || useCategoryStore().getCategoryById(event.category_id).name
									}}
									-
									{{ accountStore.getAccountName(event.account_id) }}
								</small>
							</div>
						</div>
					</div>
				</template>
			</div>
		</div>

		<TransactionDetailsDrawer
			v-if="viewingTransaction"
			:key="viewingTransaction.transaction_id"
			:transaction="viewingTransaction"
		/>

		<div class="hidden">
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
			<div style="padding: 20px; background: #f8f9fa" />
			<div style="padding: 20px; background: #f4f5f6" />
			<div style="padding: 20px; background: #f0f1f2" />
			<div style="padding: 20px; background: #e1e3e5" />
			<div style="padding: 20px; background: #d8dade" />
			<div style="padding: 20px; background: #c0c3c8" />
			<div style="padding: 20px; background: #acb0b6" />
			<div style="padding: 20px; background: #90959b" />
			<div style="padding: 20px; background: #798087" />
			<div style="padding: 20px; background: #565f66" />
			<div style="padding: 20px; background: #363f44" />
			<div style="padding: 20px; background: #1f2528" />
			<div style="padding: 20px; background: #101516" />
			<br />
			<br />

			<div
				v-for="[name, hex] in Object.entries(colors)"
				:style="{ color: '#fff', padding: '10px', background: hex }"
			>
				{{ name }}
			</div>
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
	width: 100%;
	min-width: 0;
}

.group-summary {
	background: #fff;
	box-shadow: 0 0 3px #0002;
	border-radius: 1rem;
	overflow: hidden;

	.title {
		padding: 0.5rem 0.7rem;
		/* font-weight: bold; */
	}
}
</style>
