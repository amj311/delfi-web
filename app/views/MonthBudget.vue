<script setup lang="ts">
import { useDelfiStore } from '@/stores/delfi.store';
import { useAccountStore } from '@/stores/account.store';
import { computed, reactive, ref, onMounted, watch } from 'vue';
import Forecast from '../../delfi-core/models/Forecast';
import { type DelfiDate, ddate } from '../../delfi-core/utils/dateUtils';
import Currency from '@/components/Currency.vue';
import { useCategoryStore } from '@/stores/category.store';
import type { Delfi } from 'delfi-core/Delfi';
import { type Budget } from '../../delfi-core/models/Budget';
import type { Account } from 'delfi-core/models/Account';
import { useRoute, useRouter } from 'vue-router';
import { useGroupStore } from '@/stores/group.store';
import Icon from '@/components/Icon.vue';
import { colors } from 'delfi-core/utils/constants';
import { type AttributionEvent, type Transaction } from 'delfi-core/models/Transaction';
import TransactionDetailsDrawer from '@/components/TransactionDetailsDrawer.vue';
import Accordion from 'primevue/accordion';
import AccordionContent from 'primevue/accordioncontent';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import Knob from 'primevue/knob';
import AttributionAvatar from '@/components/AttributionAvatar.vue';
import Select from 'primevue/select';
import type { BudgetSnapshot } from 'delfi-core/models/Summary';
import { useContextStore } from '@/stores/context.store';

const delfiStore = useDelfiStore();
const accountStore = useAccountStore();
const groupStore = useGroupStore();
const route = useRoute();
const router = useRouter();

const state = reactive({
	loading: true,
	viewingMonth: ddate().startOf('month'),
	forecast: <Forecast>(<unknown>null),
	upsertingAccount: <Partial<Account> | {} | null>null,
	upsertingBudget: <Budget | {} | null>null,
	summaryData: <Awaited<ReturnType<Delfi['getMonthSummary']>> | null>null,
});

// Spending breakdown view state
const spendingViews = [
	{ label: 'Budgets', value: 'budget' },
	{ label: 'Categories', value: 'category' },
];
const selectedSpendingView = ref('budget');

async function getSummary(month: DelfiDate, silent = false) {
	state.loading = !silent && true;
	if (!month || !delfiStore.delfi) {
		return null;
	}
	let summary = await delfiStore.delfi.getMonthSummary(month);
	state.summaryData = summary;
	useContextStore().setCurrentSummary(summary);
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
		return ddate().startOf('month');
	}

	const parsedDate = ddate(monthStr);
	return parsedDate.isValid() ? parsedDate.startOf('month') : ddate().startOf('month');
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

	await getSummary(state.viewingMonth);
});

// Watch for route changes to update the view
watch(
	() => route.params.month,
	async (newMonth) => {
		if (newMonth && newMonth !== formatMonthForUrl(state.viewingMonth)) {
			state.viewingMonth = parseMonthFromUrl(newMonth as string);
			await getSummary(state.viewingMonth);
		}
	}
);

watch(
	() => delfiStore.reComputed,
	async () => {
		await getSummary(state.viewingMonth, true);
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
	const newMonth = ddate(state.viewingMonth.add(1, 'month'));
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
	const newMonth = ddate(state.viewingMonth.subtract(1, 'month'));
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
	const eventsByDay: Record<number, Array<AttributionEvent>> = Object.fromEntries(Array.from({ length: 31 }, (_, i) => [i + 1, []]));
	for (const event of state.summaryData.attributionEvents) {
		const dayKey = event.date.date();
		if (!eventsByDay[dayKey]) {
			eventsByDay[dayKey] = [];
		}
		eventsByDay[dayKey].push(event);
	}
	return Object.entries(eventsByDay).flatMap(([date, events]) => ({
		date: ddate(state.viewingMonth.date(Number(date))).formatFull(),
		transactions: events.sort((a, b) => a.sourceTransaction.date_order?.localeCompare(b.sourceTransaction.date_order || '') || 0),
	}));
});

const progressColor = {
	good: colors.lime2,
	warning: colors.yellow2,
	danger: colors.cherry1,
	muted: {
		good: colors.green3,
		warning: colors.yellow1,
		danger: colors.red2,
	},
};

const openAccordions = ref<Set<string>>(new Set());
const isAccordionOpen = (key: string) => {
	return openAccordions.value.has(key);
};

const transactionDetailsDrawer = ref<InstanceType<typeof TransactionDetailsDrawer> | null>(null);
function viewTransaction(transaction: Transaction) {
	transactionDetailsDrawer.value?.open(transaction);
}

const orderedBudgets = computed(() => {
	const budgetSnapshots: Array<BudgetSnapshot> = (state.summaryData?.spendingSummary.budgets as Array<BudgetSnapshot>) || [];
	const orderedCategories = useCategoryStore().orderedCategories;
	const output = [] as BudgetSnapshot[];
	for (const category of orderedCategories) {
		output.push(
			...(budgetSnapshots
				.filter((b) => b.budget.category_id === category.category_id)
				.sort((a, b) => a.budget.memo.localeCompare(b.budget.memo)) || [])
		);
	}
	return output;
});

const changedAccounts = computed(() => {
	if (!state.summaryData || !state.summaryData.accountSummaries) {
		return [];
	}
	return state.summaryData.accountSummaries.filter((summary) => summary.budgetedChange !== 0 || summary.attributedChange !== 0);
});
const otherAccounts = computed(() => {
	if (!state.summaryData || !state.summaryData.accountSummaries) {
		return [];
	}
	return state.summaryData.accountSummaries.filter((summary) => summary.budgetedChange === 0 && summary.attributedChange === 0);
});
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
					<Currency :amount="state.summaryData.attributedNet" mode="net_change" />
					(&nbsp;<Currency :amount="state.summaryData.budgetedNet" mode="net_change" />)
				</div>
				<div class="list">
					<div v-for="summary of changedAccounts" class="list-row">
						<div class="flex">
							<div class="flex align-items-center gap-2">
								<div
									class="border-round-sm square w-2rem"
									:style="{
										backgroundImage: `url(${accountStore.getAccountById(summary.account_id)?.Institution.logo})`,
										backgroundSize: 'cover',
									}"
								></div>
								<div class="text-semibold">
									{{ accountStore.getAccountName(summary.account_id) }}
								</div>
								<!-- <button class="hover-show" @click="() => state.upsertingAccount = accountStore.getAccountById(summary.account_id)!">
									Edit
								</button> -->
							</div>
							<div class="flex-grow-1"></div>
							<div class="flex align-items-end">
								<Currency :amount="summary.attributedChange" mode="net_change" hideCurrency class="font-medium" />
								<small>&nbsp;&nbsp;/&nbsp;&nbsp;<Currency :amount="summary.budgetedChange" mode="net_change" hideCurrency /></small>
							</div>
						</div>
						<!-- <small v-for="partition of summary.partitions" class="flex align-items-center">
							&emsp13;- {{ partition.name }}
							<div class="flex-grow-1"></div>
							<div class="flex align-items-center">
								<small v-if="partition.netChange !== 0">
									<Currency :amount="partition.netChange" mode="net_change" hideCurrency />
									&emsp13;
								</small>
								<span><Currency :amount="partition.endingBalance" mode="balance" /></span>
							</div>
						</small> -->
					</div>
				</div>
				<!-- <UpsertAccountForm
					v-if="state.upsertingAccount"
					:account="state.upsertingAccount || {}"
					:close="() => (state.upsertingAccount = null)"
				/>
				<button v-else @click="() => (state.upsertingAccount = {})">Add Account</button> -->
			</div>
			<br />

			<div>
				<h3>Income</h3>
				<div>
					Total ......
					<Currency :amount="state.summaryData.incomeSummary?.tally.budgetedNet || 0" mode="net_change" />
				</div>
				<div class="list">
					<div v-for="{ budget, budgetEvents } of state.summaryData.incomeSummary?.tally.budgetSnapshots" class="list-row">
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
					<div v-for="budgetEvent of state.summaryData.transferSummary.tally.budgetEventsWithoutTransferCopies" class="list-row">
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

			<!-- <UpsertBudgetForm v-if="state.upsertingBudget" :budget="state.upsertingBudget || {}" :close="() => (state.upsertingBudget = null)" />
			<button v-else @click="() => (state.upsertingBudget = {})">Add Transaction</button> -->
			<br />
			<!-- <UpsertBudgetForm v-if="state.upsertingBudget" :budget="state.upsertingBudget || {}" :close="() => state.upsertingBudget = null" :onSave="createDelfi" />
			<button v-else @click="() => state.upsertingBudget = {}">Add Budget</button> -->

			<div v-if="state.summaryData.groupSummaries.length > 0">
				<br />
				<div v-for="{ groupId, tally } of state.summaryData.groupSummaries" class="group-summary">
					<div class="title flex align-items-center gap-1 my-2">
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
								<div v-for="childItem of budgetSnapshot.childItemEvents" class="list-row flex align-items-center gap-3">
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
														percent: (childItem.rangeTally.attributedNet / childItem.rangeTally.budgetedNet) * 100,
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
									<div class="list-row flex align-items-center gap-3" @click="viewTransaction(event.sourceTransaction)">
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
												{{ event.Budget?.memo || useCategoryStore().getCategoryById(event.category_id).name }}
												-
												{{ accountStore.getAccountName(event.account_id) }}
											</small>
										</div>
									</div>
								</template>
							</template>
						</template>
						<div v-if="tally.unBudgetedAttributions.length > 0" class="flex align-items-center list-row gap-2">
							<i class="pi pi-exclamation-triangle" />
							Unbudgeted
							<div class="flex-grow-1"></div>
							<!-- <Currency :amount="tally.unBudgetedNet" mode="transaction" /> -->
						</div>
						<div
							v-for="event of tally.unBudgetedAttributions"
							class="list-row flex align-items-center gap-3"
							@click="viewTransaction(event.sourceTransaction)"
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
									{{ event.Budget?.memo || useCategoryStore().getCategoryById(event.category_id).name }}
									-
									{{ accountStore.getAccountName(event.account_id) }}
								</small>
							</div>
						</div>
					</div>
				</div>
				<br />
			</div>

			<div>
				<div class="flex align-items-center gap-2">
					<h3>Spending</h3>
					<Select
						v-model="selectedSpendingView"
						:options="spendingViews"
						optionLabel="label"
						optionValue="value"
						size="small"
						aria-labelledby="spending-view-select"
					/>
					<div class="flex-grow-1"></div>
					<div class="flex align-items-center gap-2">
						<Currency :amount="state.summaryData.spendingSummary.tally.attributedNet" mode="transaction" />
						/
						<Currency :amount="state.summaryData.spendingSummary.tally.budgetedNet" mode="transaction" />
					</div>
				</div>
				<div v-if="selectedSpendingView === 'category'">
					<Accordion multiple>
						<template v-for="(category, i) of state.summaryData.spendingSummary.categories">
							<AccordionPanel :value="i" v-if="category.tally.attributionEvents.length > 0">
								<AccordionHeader class="flex align-items-center gap-2">
									<AttributionAvatar :category="category.category" :size="2" />
									<b>{{ category.category.name }}</b>
									<div class="flex-grow-1"></div>
									<Currency :amount="category.tally.attributedNet || 0" mode="transaction" class="text-semibold" />
								</AccordionHeader>
								<AccordionContent>
									<template v-for="budgetSummary of category.tally.budgetSnapshots">
										<template v-if="budgetSummary.attributedEvents.length > 0">
											<div class="flex hover-show-trigger list-row gap-2">
												<div class="flex align-items-center gap-2">
													<i class="pi pi-wallet" />
													{{ budgetSummary.budget.memo }}
												</div>
												<div class="flex-grow-1"></div>
												<!-- <Currency :amount="budgetSummary.tally.attributedNet" mode="transaction" /> -->
											</div>
											<template
												v-for="event of budgetSummary.tally.attributionEvents"
											>
												<!-- only display one from transfer pair -->
												<div
													class="list-row flex align-items-center gap-3"
													v-if="!event.isTransferCopy"
													@click="viewTransaction(event.sourceTransaction)"
												>
													<div>
														<AttributionAvatar :event="event" :size="1.9">
															<template #badge v-if="event.isSplit">
																<Icon source_id="arrow_split" source="material-symbols" />
															</template>
															<template #badge v-if="event.isTransferPair">
																<Icon source_id="sync_alt" source="material-symbols" />
															</template>
														</AttributionAvatar>
													</div>
													<div class="flex flex-column w-full min-w-0">
														<div class="flex align-items-center gap-2">
															<div class="flex align-items-center w-full min-w-0">
																<div class="text-ellipsis">
																	<span class="font-medium">{{ event.displayName }}</span>
																	<small v-if="event.memo">&nbsp;- {{ event.softDescription }}</small>
																</div>
															</div>
															<div style="flex-grow: 1"></div>
															<div class="font-medium flex align-items-center gap-1">
																<Icon
																	v-if="event.isTransferPair"
																	source_id="sync_alt"
																	source="material-symbols"
																></Icon>
																<Currency :amount="event.amount" mode="transaction" />
															</div>
														</div>
														<small class="text-ellipsis">
															{{ event.Budget?.memo || useCategoryStore().getCategoryById(event.category_id).name }}
															-
															{{ accountStore.getAccountName(event.account_id) }}
														</small>
													</div>
												</div>
											</template>
										</template>
									</template>
									<div v-if="category.tally.unBudgetedAttributions.length > 0" class="flex align-items-center list-row gap-2">
										<i class="pi pi-exclamation-triangle" />
										Unbudgeted
										<div class="flex-grow-1"></div>
										<Currency :amount="category.tally.unBudgetedNet" mode="transaction" />
									</div>
									<template v-for="event of category.tally.unBudgetedAttributions">
										<!-- only display one from transfer pair -->
										<div
											class="list-row flex align-items-center gap-3"
											v-if="!event.isTransferCopy"
											@click="viewTransaction(event.sourceTransaction)"
										>
											<div>
												<AttributionAvatar :event="event" :size="1.9">
													<template #badge v-if="event.isSplit">
														<Icon source_id="arrow_split" source="material-symbols" />
													</template>
													<template #badge v-if="event.isTransferPair">
														<Icon source_id="sync_alt" source="material-symbols" />
													</template>
												</AttributionAvatar>
											</div>
											<div class="flex flex-column w-full min-w-0">
												<div class="flex align-items-center gap-2">
													<div class="flex align-items-center w-full min-w-0">
														<div class="text-ellipsis">
															<span class="font-medium">{{ event.displayName }}</span>
															<small v-if="event.memo">&nbsp;- {{ event.softDescription }}</small>
														</div>
													</div>
													<div style="flex-grow: 1"></div>
													<div class="font-medium flex align-items-center gap-1">
														<Icon v-if="event.isTransferPair" source_id="sync_alt" source="material-symbols"></Icon>
														<Currency :amount="event.amount" mode="transaction" />
													</div>
												</div>
												<small class="text-ellipsis">
													{{ event.Budget?.memo || useCategoryStore().getCategoryById(event.category_id).name }}
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
				<div v-else-if="selectedSpendingView === 'budget'">
					<Accordion multiple @update:value="(value) => (openAccordions = new Set(value))">
						<AccordionPanel value="0">
							<AccordionHeader class="flex align-items-center gap-2">
								<AttributionAvatar icon="question-circle" :size="2" :background="'cherry1'" />
								<b>Unbudgeted</b>
								<div class="flex-grow-1"></div>
								<Currency :amount="state.summaryData.allUnbudgeted.unBudgetedNet" mode="transaction" />
							</AccordionHeader>
							<AccordionContent>
								<template
									v-for="(event, i) of state.summaryData.allUnbudgeted.unBudgetedAttributions
										.slice()
										.sort((a, b) => (a.date.isBefore(b.date) ? -1 : 1))"
								>
									<!-- only display one from transfer pair -->
									<div
										class="list-row flex align-items-center gap-3 px=0"
										v-if="!event.isTransferCopy"
										@click="viewTransaction(event.sourceTransaction)"
									>
										<div>
											<AttributionAvatar :event="event" :size="1.9">
												<template #badge v-if="event.isSplit">
													<Icon source_id="arrow_split" source="material-symbols" />
												</template>
												<template #badge v-if="event.isTransferPair">
													<Icon source_id="sync_alt" source="material-symbols" />
												</template>
											</AttributionAvatar>
										</div>
										<div class="flex flex-column w-full min-w-0">
											<div class="flex align-items-center gap-2">
												<div class="flex align-items-center w-full min-w-0">
													<div class="text-ellipsis">
														<span class="font-medium">{{ event.displayName }}</span>
														<small v-if="event.memo">&nbsp;- {{ event.softDescription }}</small>
													</div>
												</div>
												<div style="flex-grow: 1"></div>
												<div class="font-medium flex align-items-center gap-1">
													<Icon v-if="event.isTransferPair" source_id="sync_alt" source="material-symbols"></Icon>
													<Currency :amount="event.amount" mode="transaction" />
												</div>
											</div>
											<small class="text-ellipsis">
												{{ event.Budget?.memo || useCategoryStore().getCategoryById(event.category_id).name }}
												-
												{{ accountStore.getAccountName(event.account_id) }}
											</small>
										</div>
									</div>
								</template>
							</AccordionContent>
						</AccordionPanel>
						<template v-for="budgetSnapshot of orderedBudgets">
							<AccordionPanel :value="budgetSnapshot.budget.budget_id">
								<AccordionHeader
									class="budget-header flex align-items-center gap-2"
									:class="{ open: isAccordionOpen(budgetSnapshot.budget.budget_id) }"
								>
									<AttributionAvatar :category="budgetSnapshot.budget.Category" :size="2" />
									<b>{{ budgetSnapshot.budget.memo }}</b>
									<div class="flex-grow-1"></div>
									<div class="flex align-items-center gap-2">
										<!-- <Currency
										:amount="budgetSummary.tally.attributedNet || 0"
										mode="transaction"
										class="text-semibold"
									/> -->
										<!-- {{ Math.floor(budgetSnapshot.progress(date()).percent) }}% -->
										<div class="budget-total"><Currency :amount="budgetSnapshot.tally.attributedNet" /></div>

										<Knob
											class="budget-progress-knob"
											v-model="budgetSnapshot.progress(ddate()).visualization.normalizedPercent"
											:min="0"
											:max="100"
											:size="25"
											:strokeWidth="15"
											:valueColor="progressColor[budgetSnapshot.progress(ddate()).status]"
											:readonly="true"
											:showValue="false"
											style="padding-top: 5px"
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
								<AccordionContent class="budget-content" :class="{ open: isAccordionOpen(budgetSnapshot.budget.budget_id) }">
									<!-- // PROGRESS BAR -->
									<div class="flex align-items-center gap-2 my-2 w-full">
										<div class="flex-grow-1">
											<div
												class="budget-progress-bar bg-black-alpha-10"
												style="position: relative; padding: 4px 6px; width: 100%; border-radius: 4px"
											>
												<div
													class="attributed-bar"
													:style="{
														position: 'absolute',
														top: '0',
														left: '0',
														width: Math.min(100, budgetSnapshot.progress(ddate()).visualization.normalizedPercent) + '%',
														height: '100%',
														borderRadius: '4px',
														backgroundColor: progressColor.muted[budgetSnapshot.progress(ddate()).status],
													}"
												></div>
												<div
													class="budget-line"
													v-if="budgetSnapshot.progress(ddate()).visualization.normalizedBudgetedNet < 99"
													:style="{
														position: 'absolute',
														top: '-2px',
														bottom: '-2px',
														left: budgetSnapshot.progress(ddate()).visualization.normalizedBudgetedNet + '%',
														borderLeft: '1px solid ' + colors.gray8,
														translate: '-51%',
													}"
												></div>
												<div
													class="pace-marker"
													v-if="budgetSnapshot.progress(ddate()).visualization.normalizedPace < 99"
													:style="{
														position: 'absolute',
														lineHeight: '0.3em',
														fontSize: '2em',
														translate: '-50% -100%',
														verticalAlign: 'top',
														top: '0',
														left: budgetSnapshot.progress(ddate()).visualization.normalizedPace + '%',
													}"
												>
													▾
												</div>
												<div class="flex align-items-center relative">
													<div v-if="Math.abs(100 - budgetSnapshot.progress(ddate()).percent) > 1">
														<Currency round :amount="Math.abs(budgetSnapshot.rangeBudgetRemaining)" />
														{{ budgetSnapshot.progress(ddate()).percent > 100 ? 'over' : 'remaining' }}
													</div>
													<div v-else>✓</div>
													&nbsp;
													<!-- <div v-else-if="budgetSnapshot.progress(date()).percent < 100">
														<Currency
															:amount="Math.abs(budgetSnapshot.rangeBudgetRemaining).toFixed(2)"
														/>
														remaining
													</div> -->
												</div>
											</div>
										</div>
										<div>
											<Currency :amount="budgetSnapshot.tally.budgetedNet" />
										</div>
									</div>
									<div v-for="childItem of budgetSnapshot.childItemEvents" class="list-row flex align-items-center gap-3 px-0">
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
															percent: (childItem.rangeTally.attributedNet / childItem.rangeTally.budgetedNet) * 100,
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
										<!-- only display one from transfer pair -->
										<div
											class="list-row flex align-items-center gap-3 px-0"
											v-if="!event.isTransferCopy"
											@click="viewTransaction(event.sourceTransaction)"
										>
											<div>
												<AttributionAvatar :event="event" :size="1.9">
													<template #badge v-if="event.isSplit">
														<Icon source_id="arrow_split" source="material-symbols" />
													</template>
													<template #badge v-if="event.isTransferPair">
														<Icon source_id="sync_alt" source="material-symbols" />
													</template>
												</AttributionAvatar>
											</div>
											<div class="flex flex-column w-full min-w-0">
												<div class="flex align-items-center gap-2">
													<div class="flex align-items-center w-full min-w-0">
														<div class="text-ellipsis">
															<span class="font-medium">{{ event.displayName }}</span>
															<small v-if="event.memo">&nbsp;- {{ event.softDescription }}</small>
														</div>
													</div>
													<div style="flex-grow: 1"></div>
													<div class="font-medium flex align-items-center gap-1">
														<Icon v-if="event.isTransferPair" source_id="sync_alt" source="material-symbols"></Icon>
														<Currency :amount="event.amount" mode="transaction" />
													</div>
												</div>
												<small class="text-ellipsis">
													{{ event.Budget?.memo || useCategoryStore().getCategoryById(event.category_id).name }}
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
			</div>
		</div>

		<br />
		<br />
		<h3>Transactions</h3>
		<template v-for="(day, i) of dailyEvents">
			<div v-if="day.transactions.length > 0">
				<h4
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
					{{ day.date }}
				</h4>
				<div class="list">
					<template v-for="event in day.transactions">
						<!-- only display one from transfer pair -->
						<div
							class="list-row flex align-items-center gap-3"
							v-if="!event.isTransferCopy"
							@click="viewTransaction(event.sourceTransaction)"
						>
							<div>
								<AttributionAvatar :event="event" style="width: 2.5rem; font-size: 1.2rem">
									<template #badge v-if="event.isSplit">
										<Icon source_id="arrow_split" source="material-symbols" />
									</template>
									<template #badge v-if="event.isTransferPair">
										<Icon source_id="sync_alt" source="material-symbols" />
									</template>
								</AttributionAvatar>
							</div>
							<div class="flex flex-column w-full min-w-0">
								<div class="flex align-items-center gap-2">
									<div class="flex align-items-center w-full min-w-0">
										<div class="text-ellipsis">
											<span class="font-medium">{{ event.displayName }}</span>
											<small v-if="event.memo">&nbsp;- {{ event.softDescription }}</small>
										</div>
									</div>
									<div style="flex-grow: 1"></div>
									<div class="font-medium flex align-items-center gap-1">
										<Icon v-if="event.isTransferPair" source_id="sync_alt" source="material-symbols"></Icon>
										<Currency :amount="event.amount" mode="transaction" />
									</div>
								</div>
								<small class="text-ellipsis">
									{{ event.Budget?.memo || useCategoryStore().getCategoryById(event.category_id).name }}
									-
									{{ accountStore.getAccountName(event.account_id) }}
								</small>
							</div>
						</div>
					</template>
				</div>
			</div>
		</template>

		<TransactionDetailsDrawer ref="transactionDetailsDrawer" />

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

			<div v-for="[name, hex] in Object.entries(colors)" :style="{ color: '#fff', padding: '10px', background: hex }">
				{{ name }}
			</div>
		</div>
	</main>
	<!-- ...existing code... -->
</template>

<style scoped lang="scss">
.list {
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.list-row {
	padding: 6px 8px;
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

.budget-header {
	overflow: hidden;

	.budget-total {
		transition: 0.3s ease-in;
	}

	.budget-progress-knob {
		transition: 0.3s ease-in;
		translate: 0 0;
	}

	&.open {
		.budget-total {
			translate: 30px;
		}
		.budget-progress-knob {
			translate: 0 105%;
			opacity: 0;
		}
	}
}

.budget-content {
	&:not(.open) {
		display: block !important;
		max-height: 0;
		overflow: hidden;
	}

	.budget-progress-bar {
		max-width: 0;
		transition: 0.3s ease-in;
	}
	&.open .budget-progress-bar {
		max-width: 100% !important;
	}
}
</style>
