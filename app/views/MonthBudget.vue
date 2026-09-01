<script setup lang="ts">
import { useDelfiStore } from '@/stores/delfi.store';
import { useAccountStore } from '@/stores/account.store';
import { computed, reactive, ref, onMounted, watch, nextTick } from 'vue';
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
import { BudgetEventSummary, RealityTally, type BudgetSnapshot, type CommonEvent } from 'delfi-core/models/Summary';
import { useContextStore } from '@/stores/context.store';
import CommonEventRow from '@/components/CommonEventRow.vue';
import Button from 'primevue/button';
import { currency } from 'delfi-core/utils/miscUtils';
import CollapseList from '@/components/utils/CollapseList.vue';
import Dialog from 'primevue/dialog';
import { useAppStore } from '@/stores/app.store';
import UpsertBudgetDrawer from '@/components/UpsertBudgetDrawer.vue';

const delfiStore = useDelfiStore();
const accountStore = useAccountStore();
const groupStore = useGroupStore();
const route = useRoute();
const router = useRouter();

const showTestDrawer = ref(false);

const state = reactive({
	loading: true,
	viewingMonth: ddate().startOf('month'),
	forecast: <Forecast>(<unknown>null),
	upsertingAccount: <Partial<Account> | {} | null>null,
	upsertingBudget: <Budget | {} | null>null,
	summaryData: <Awaited<ReturnType<Delfi['getMonthSummary']>> | null>null,
});

const isFuture = computed(() => {
	if (!state.viewingMonth) {
		return false;
	}
	return state.viewingMonth.isAfter(ddate());
});
const isPast = computed(() => {
	if (!state.viewingMonth) {
		return false;
	}
	return state.viewingMonth.isBefore(ddate(), 'month');
});
const isCurrentMonth = computed(() => {
	if (!state.viewingMonth) {
		return false;
	}
	const now = ddate();
	return state.viewingMonth.startOf('month').isSame(now, 'month');
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
	let summary = await delfiStore.getMonthSummary(month);
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
	// return state.viewingMonth.isAfter(delfiStore.delfi.start);
	return true;
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
	return Object.entries(eventsByDay).flatMap(([date, events]) => ({
		date: ddate(state.viewingMonth.date(Number(date))).format('full'),
		transactions: events.sort(
			(a, b) =>
				a.attributionDetails.sourceTransaction.date_order?.localeCompare(
					b.attributionDetails.sourceTransaction.date_order || ''
				) || 0
		),
	}));
});

const expenseColor = {
	underPace: colors.lime2,
	onPace: colors.lime2,
	overPace: colors.yellow2,
	overBudget: colors.cherry1,
	muted: {
		underPace: colors.green3,
		onPace: colors.green3,
		overPace: colors.yellow1,
		overBudget: colors.red2,
	},
};

const savingsColor = {
	underPace: colors.yellow2,
	onPace: colors.lime2,
	overPace: colors.lime2,
	overBudget: colors.lime2,
	muted: {
		underPace: colors.yellow1,
		onPace: colors.green3,
		overPace: colors.green3,
		overBudget: colors.green3,
	},
};

const openAccordions = ref<Set<string>>(new Set());
const isAccordionOpen = (key: string) => {
	return openAccordions.value.has(key);
};

const transactionDetailsDrawer = ref<InstanceType<typeof TransactionDetailsDrawer> | null>(null);
const viewingTransaction = ref<Transaction | null>(null);
function viewTransaction(transaction: Transaction) {
	viewingTransaction.value = transaction;
	nextTick(() => {
		transactionDetailsDrawer.value?.open(transaction);
	});
}

const orderedBudgets = computed(() => {
	const budgetSnapshots: Array<BudgetSnapshot> =
		(state.summaryData?.spendingSummary.budgets as Array<BudgetSnapshot>) || [];
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

const accounts = computed(() => {
	const accountSummaries = state.summaryData?.accountSummaries;
	if (!accountSummaries) {
		return [] as NonNullable<typeof accountSummaries>;
	}
	return accountSummaries.sort((a, b) => {
		const aFlow = Math.abs(isFuture.value ? a.budgetedChange : a.attributedChange);
		const bFlow = Math.abs(isFuture.value ? b.budgetedChange : b.attributedChange);
		return bFlow - aFlow;
	});
});

const dailyAccumulation = computed(() => {
	if (!state.summaryData) {
		return [];
	}
	const days: Array<{
		day: DelfiDate;
		budgetEvents: Array<BudgetEventSummary>;
		attributedEvents: Array<AttributionEvent>;
	}> = Array.from({ length: state.viewingMonth.daysInMonth() }, (_, i) => ({
		day: ddate(state.viewingMonth.date(i + 1)),
		budgetEvents: [],
		attributedEvents: [],
	}));
	for (const event of state.summaryData.netTally.budgetEvents) {
		const dayKey = event.date.date();
		days[dayKey - 1].budgetEvents.push(event as BudgetEventSummary);
	}
	for (const event of state.summaryData.netTally.attributionEvents) {
		const dayKey = event.date.date();
		days[dayKey - 1].attributedEvents.push(event);
	}
	let runningBudgeted = 0;
	let runningAttributed = 0;
	return days.map((day) => {
		const tally = new RealityTally(day.budgetEvents, day.attributedEvents);
		const previousUnfinishedEvents = state.summaryData!.forecast.unfinishedNetEvents.filter((e) =>
			e.date.isSameOrBefore(day.day)
		);
		const forecastNet = day.day.isFuture()
			? runningAttributed + previousUnfinishedEvents.reduce((sum, e) => sum + e.amount, 0)
			: null;

		runningAttributed += tally.attributedNet;

		return {
			...day,
			tally,
			runningBudgeted: (runningBudgeted += tally.budgetedNet),
			runningAttributed: day.day.isFuture() ? null : runningAttributed,
			runningForecasted: day.day.isToday() ? runningAttributed : forecastNet,
			// budgetIncome: tally.budgetedIncome,
			// budgetExpense: tally.budgetedExpense,
			attributedIncome: tally.attributedIncome,
			attributedExpense: tally.attributedExpense,
		};
	});
});

const chartColors = {
	budgeted: '#038ffb',
	attributed: '#00E396',
	forecast: '#feb019',
};

const accumulationChart = computed(() => {
	const dailyBudgeted = dailyAccumulation.value.map((d) =>
		d.runningBudgeted === null ? null : Math.round(d.runningBudgeted)
	);
	const dailyAttributed = dailyAccumulation.value.map((d) =>
		d.runningAttributed === null ? null : Math.round(d.runningAttributed)
	);
	const dailyForecasted = dailyAccumulation.value.map((d) =>
		d.runningForecasted === null ? null : Math.round(d.runningForecasted)
	);
	// const dailyIncome = dailyAccumulation.value.map((d) => d.attributedIncome === null ? null : Math.round(d.attributedIncome));
	// const dailyExpense = dailyAccumulation.value.map((d) => d.attributedExpense === null ? null : Math.round(d.attributedExpense));

	if (!state.summaryData) {
		return {
			options: {},
			series: [],
		};
	}

	return {
		options: {
			grid: {
				padding: {
					left: -10,
					right: 0,
					top: 0,
					bottom: 0,
				},
			},
			dataLabels: {
				enabled: false,
			},
			fill: {
				opacity: 0.5,
			},
			chart: {
				id: 'vuechart-example',
				zoom: {
					enabled: false,
				},
				toolbar: {
					show: false,
				},
				stacked: true,
			},
			tooltip: {
				// enabled: true,
			},
			xaxis: {
				categories: [],
				labels: {
					show: false,
				},
			},
			yaxis: {
				labels: {
					// show: false,
					offsetX: -15,
				},
			},
			stroke: {
				width: 2,
			},
			annotations: {
				yaxis: [
					isPast.value && {
						y: state.summaryData.netTally.attributedNet,
						borderColor: chartColors.attributed,
						borderWidth: 2,
						borderStyle: 'solid',
						label: {
							position: 'center',
							borderColor: chartColors.attributed,
							style: {
								color: '#fff',
								background: chartColors.attributed,
							},
							text: currency(state.summaryData.netTally.attributedNet),
						},
					},
					isCurrentMonth.value && {
						y: state.summaryData.forecast.endNet,
						borderColor: chartColors.forecast,
						borderWidth: 2,
						borderStyle: 'solid',
						label: {
							position: 'center',
							borderColor: chartColors.forecast,
							style: {
								color: '#fff',
								background: chartColors.forecast,
							},
							text: currency(state.summaryData.forecast.endNet),
						},
					},
					isFuture.value && {
						y: state.summaryData.netTally.budgetedNet,
						borderColor: chartColors.budgeted,
						borderWidth: 2,
						borderStyle: 'solid',
						label: {
							position: 'center',
							borderColor: chartColors.budgeted,
							style: {
								color: '#fff',
								background: chartColors.budgeted,
							},
							text: currency(state.summaryData.netTally.budgetedNet),
						},
					},
				],
			},
		},
		// include zeros as starting point
		series: [
			...(!isFuture.value
				? [
						{
							type: 'area',
							name: 'Actual',
							data: [0, ...dailyAttributed],
							color: chartColors.attributed,
						},
				  ]
				: []),
			{
				type: 'area',
				name: 'Budgeted',
				data: [0, ...dailyBudgeted],
				color: chartColors.budgeted,
			},
			...(isCurrentMonth.value
				? [
						{
							type: 'area',
							name: 'Forecast',
							data: [0, ...dailyForecasted],
							color: chartColors.forecast,
						},
				  ]
				: []),
			
			// {
			// 	type: 'bar',
			// 	name: 'Income',
			// 	data: dailyIncome,
			// },
			// {
			// 	type: 'bar',
			// 	name: 'Expense',
			// 	data: dailyExpense,
			// },
		],
	};
});

const upsertBudgetDrawer = ref<InstanceType<typeof UpsertBudgetDrawer>>();
function openBudgetEditor(budget: Budget) {
	upsertBudgetDrawer.value?.open(budget);
}
</script>

<template>
	<main>
		<div class="bg py-2 flex align-items-center justify-content-between" style="position: sticky; top: 0; z-index: 4; margin: 0 -5px">
			<Button text @click="goBack()">Back</Button>
			<span>{{ state.viewingMonth?.format('MMMM YYYY') }}</span>
			<Button text @click="goForward()">Forward</Button>
		</div>
		<br />
		<div v-if="state.loading">Loading...</div>

		<div v-else-if="state.summaryData" class="column-layout" :class="{ mobile: useAppStore().isMobile }">
			<!-- column left/bottom -->
			<div>
				<div v-if="state.summaryData.groupSummaries.length > 0">
					<div v-for="{ groupId, tally } of state.summaryData.groupSummaries" class="group-summary mb-4">
						<div class="title flex align-items-center gap-1 my-2">
							<Icon name="tag" fill :color="groupStore.getGroupById(groupId)?.color" />
							<b>{{ groupStore.getGroupById(groupId)?.name }}</b>
							<div class="flex-grow-1"></div>
							<div class="flex align-items-center gap-1">
								<Currency :amount="tally.attributedNet || 0" mode="transaction" class="text-semibold" />
							</div>
						</div>
						<div class="px-3">
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
										v-for="childItem of budgetSnapshot.childItemBudgets"
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
													<Currency
														:amount="childItem.rangeTally.attributedNet"
														mode="transaction"
													/>
												</div>
												<Knob
													v-if="!isFuture"
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
										</div>
									</div>
									<template
										v-for="event of isFuture
											? budgetSnapshot.budgetEvents
											: budgetSnapshot.notChildAttributions"
									>
										<CommonEventRow
											:event="event"
											@click="() => event.projectionDetails ? null : viewTransaction(event.attributionDetails!.sourceTransaction)"
											expand
											hideGroup
										/>
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
							<CommonEventRow
								v-for="event of tally.unBudgetedAttributions"
								:event="event"
								@click="() => event.projectionDetails ? null : viewTransaction(event.attributionDetails!.sourceTransaction)"
								expand
								hideGroup
								hideBudget
							/>
						</div>
					</div>
					<br />
				</div>

				<div>
					<div class="flex align-items-center gap-2 py-2">
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
						<div class="flex align-items-center">
							<Currency
								:amount="
									isFuture
										? state.summaryData.spendingSummary.tally.budgetedNet
										: state.summaryData.spendingSummary.tally.attributedNet
								"
								class="font-semibold"
							/>
							<small v-if="!isFuture" class="flex align-items-center"
								>&nbsp;&nbsp;/&nbsp;<Currency
									:amount="state.summaryData.spendingSummary.tally.budgetedNet"
							/></small>
						</div>
					</div>
					<div v-if="selectedSpendingView === 'budget'" class="list">
						<Accordion
							multiple
							@update:value="(value) => (openAccordions = new Set(value))"
							:value="Array.from(openAccordions)"
						>
							<AccordionPanel value="0" v-if="!isFuture">
								<AccordionHeader class="flex align-items-center gap-2 font-bold">
									<AttributionAvatar icon="question-circle" :size="2.5" :background="'cherry1'" />
									<b>Unbudgeted</b>
									<div class="flex-grow-1"></div>
									<Currency
										:amount="state.summaryData.allUnbudgeted.unBudgetedNet"
										mode="transaction"
										:style="{ color: colors.cherry3 }"
									/>
								</AccordionHeader>
								<AccordionContent>
									<template
										v-for="(event, i) of state.summaryData.allUnbudgeted.unBudgetedAttributions"
									>
										<CommonEventRow
											:event="event"
											@click="() => event.projectionDetails ? null : viewTransaction(event.attributionDetails!.sourceTransaction)"
											expand
											hideBudget
										/>
									</template>
								</AccordionContent>
							</AccordionPanel>
							<template v-for="budgetSnapshot of orderedBudgets">
								<AccordionPanel
									v-if="budgetSnapshot.tally.hasInfo"
									:value="budgetSnapshot.budget.budget_id"
								>
									<AccordionHeader
										class="budget-header flex align-items-center gap-2"
										:class="{ shift: !isFuture && isAccordionOpen(budgetSnapshot.budget.budget_id) }"
									>
										<AttributionAvatar :category="budgetSnapshot.budget.Category" :size="2.5" />
										<b class="text-ellipsis">{{ budgetSnapshot.budget.memo }}</b>
										<div class="flex-grow-1"></div>
										<div class="flex align-items-center gap-2">
											<div class="budget-total">
												<Currency
													:amount="
														isFuture
															? budgetSnapshot.tally.budgetedNet
															: budgetSnapshot.tally.attributedNet
													"
												/>
											</div>

											<Knob
												v-if="!isFuture"
												class="budget-progress-knob"
												v-model="budgetSnapshot.progress(ddate()).visualization.normalizedPercent"
												:min="0"
												:max="100"
												:size="25"
												:strokeWidth="15"
												:valueColor="expenseColor[budgetSnapshot.progress(ddate()).status]"
												:readonly="true"
												:showValue="false"
												style="padding-top: 5px"
											/>
										</div>
									</AccordionHeader>
									<AccordionContent
										class="budget-content"
										:class="{ shift: !isFuture && isAccordionOpen(budgetSnapshot.budget.budget_id) }"
									>
										<!-- PROGRESS BAR -->
										<div v-if="!isFuture" class="flex align-items-center gap-3 my-2 w-full">
											<div class="flex-grow-1">
												<div
													class="budget-progress-bar bg-black-alpha-10"
													style="
														position: relative;
														padding: 4px 6px;
														width: 100%;
														border-radius: 4px;
													"
												>
													<div
														class="attributed-bar"
														:style="{
															position: 'absolute',
															top: '0',
															left: '0',
															width:
																Math.min(
																	100,
																	budgetSnapshot.progress(ddate()).visualization
																		.normalizedPercent
																) + '%',
															height: '100%',
															borderRadius: '4px',
															backgroundColor:
																expenseColor.muted[budgetSnapshot.progress(ddate()).status],
														}"
													></div>
													<div
														class="budget-line"
														v-if="
															budgetSnapshot.progress(ddate()).visualization
																.normalizedBudgetedNet < 99
														"
														:style="{
															position: 'absolute',
															top: '-2px',
															bottom: '-2px',
															left:
																budgetSnapshot.progress(ddate()).visualization
																	.normalizedBudgetedNet + '%',
															borderLeft: '1px solid ' + colors.gray8,
															translate: '-51%',
														}"
													></div>
													<div
														class="pace-marker"
														v-if="
															budgetSnapshot.progress(ddate()).visualization.normalizedPace <
															99
														"
														:style="{
															position: 'absolute',
															lineHeight: '0.3em',
															fontSize: '2em',
															translate: '-50% -100%',
															verticalAlign: 'top',
															top: '0',
															left:
																budgetSnapshot.progress(ddate()).visualization
																	.normalizedPace + '%',
														}"
													>
														▾
													</div>
													<div class="flex align-items-center relative">
														<div
															v-if="
																Math.abs(100 - budgetSnapshot.progress(ddate()).percent) > 1
															"
														>
															<Currency
																round
																:amount="Math.abs(budgetSnapshot.rangeBudgetRemaining)"
															/>
															{{
																budgetSnapshot.progress(ddate()).percent > 100
																	? 'over'
																	: 'remaining'
															}}
														</div>
														<div v-else>✓</div>
													</div>
												</div>
											</div>
											<div>
												<Currency :amount="budgetSnapshot.tally.budgetedNet" />
											</div>
										</div>
										<div class="text-right">
											<Button
												icon="pi pi-pencil"
												text
												severity="secondary"
												size="small"
												@click="openBudgetEditor(budgetSnapshot.budget)"
												label="Edit"
											/>
										</div>
										<div v-for="childItem of budgetSnapshot.childItemBudgets" class="list-row">
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
														<Currency
															:amount="childItem.rangeTally.attributedNet"
															mode="transaction"
														/>
													</div>
													<Knob
														v-if="!isFuture"
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
										<template
											v-for="event of isFuture
												? budgetSnapshot.budgetEvents
												: budgetSnapshot.notChildAttributions"
										>
											<CommonEventRow
												:event="event"
												@click="() => event.projectionDetails ? null : viewTransaction(event.attributionDetails!.sourceTransaction)"
												expand
												hideBudget
											/>
										</template>
									</AccordionContent>
								</AccordionPanel>
							</template>
						</Accordion>
					</div>
					<div v-else-if="selectedSpendingView === 'category'">
						<Accordion
							multiple
							@update:value="(value) => (openAccordions = new Set(value))"
							:value="Array.from(openAccordions)"
						>
							<template v-for="(category, i) of state.summaryData.spendingSummary.categories">
								<AccordionPanel
									:value="i"
									v-if="
										isFuture
											? category.tally.budgetEvents.length > 0
											: category.tally.attributionEvents.length > 0
									"
								>
									<AccordionHeader class="flex align-items-center gap-2">
										<AttributionAvatar :category="category.category" :size="2.5" />
										<b>{{ category.category.name }}</b>
										<div class="flex-grow-1"></div>
										<Currency
											:amount="isFuture ? category.tally.budgetedNet : category.tally.attributedNet"
											mode="transaction"
											class="text-semibold"
										/>
									</AccordionHeader>
									<AccordionContent>
										<template v-for="budgetSnapshot of category.tally.budgetSnapshots">
											<!-- only show budget totals for future -->
											<template v-if="isFuture">
												<!-- only display one from transfer pair -->
												<div class="list-row flex align-items-center gap-3">
													<div>
														<AttributionAvatar
															:category="budgetSnapshot.budget.Category"
															:size="1.9"
														>
															<template #badge>
																<i class="pi pi-wallet" style="font-size: 0.95em" />
															</template>
														</AttributionAvatar>
													</div>
													<div class="flex flex-column w-full min-w-0">
														<div class="flex align-items-center gap-2">
															<div class="flex align-items-center w-full min-w-0">
																<div class="text-ellipsis">
																	<span class="font-medium">{{
																		budgetSnapshot.budget.memo
																	}}</span>
																</div>
															</div>
															<div style="flex-grow: 1"></div>
															<div class="font-medium flex align-items-center gap-1">
																<Currency
																	:amount="budgetSnapshot.budgetedAtEnd"
																	mode="transaction"
																/>
															</div>
														</div>
														<div class="flex align-items-center gap-2">
															<small class="text-ellipsis">
																{{
																	accountStore.getAccountName(
																		budgetSnapshot.budget.account_id
																	)
																}}
															</small>
														</div>
													</div>
												</div>
											</template>

											<!-- otherwise show actual transactions -->
											<template v-else-if="budgetSnapshot.attributedEvents.length > 0">
												<div class="flex hover-show-trigger list-row gap-2">
													<div class="flex align-items-center gap-2">
														<i class="pi pi-wallet" />
														{{ budgetSnapshot.budget.memo }}
													</div>
													<div class="flex-grow-1"></div>
													<!-- <Currency :amount="budgetSummary.tally.attributedNet" mode="transaction" /> -->
												</div>

												<div v-for="event of budgetSnapshot.tally.attributionEvents">
													<CommonEventRow
														:event="event"
														@click="
															() =>
																viewTransaction(event.attributionDetails.sourceTransaction)
														"
														expand
													/>
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
										<div v-for="event of category.tally.unBudgetedAttributions">
											<CommonEventRow
												:event="event"
												@click="() => viewTransaction(event.attributionDetails.sourceTransaction)"
												expand
												hideBudget
											/>
										</div>
									</AccordionContent>
								</AccordionPanel>
							</template>
						</Accordion>
					</div>
				</div>

				<br />
				<br />
				<h3 v-if="!isFuture">Transactions</h3>
				<template v-for="(day, i) of dailyEvents">
					<div v-if="day.transactions.length > 0">
						<h4
							:style="{
								padding: '8px 8px',
								marginTop: '8px',
								position: 'sticky',
								top: '3rem',
								backgroundColor: '#ffff',
								zIndex: 3,
								marginLeft: '-5px',
								marginRight: '-5px',
							}"
						>
							{{ day.date }}
						</h4>
						<div>
							<div>
								<CommonEventRow
									v-for="event in day.transactions"
									:event="event"
									:hideDate="true"
									@click="() => viewTransaction(event.attributionDetails.sourceTransaction)"
								/>
							</div>
						</div>
					</div>
				</template>
			</div>
			
			<!-- column top/right -->
			<div>
				
				<div>
					<div class="flex align-items-center gap-2">
						<h3>Net Growth</h3>
						<div class="flex-grow-1"></div>
						<Currency
							:amount="isFuture ? state.summaryData.budgetedNet : state.summaryData.attributedNet"
							mode="net_change"
							class="font-semibold"
						/>
						<small v-if="!isFuture" class="flex align-items-center">
							/&nbsp;
							<Currency :amount="state.summaryData.budgetedNet" mode="net_change" />
						</small>
					</div>
					<apexchart class="w-full" type="bar" v-bind="accumulationChart"></apexchart>
				</div>
				
				<div>
					<div class="flex align-items-center py-2">
						<h3>Accounts</h3>
					</div>
					<div class="list">
						<CollapseList :items="accounts" :itemHeight="55">
							<template #default="{ item: summary }">
								<div class="list-row px-2">
									<div class="flex">
										<div class="flex align-items-center gap-2">
											<div
												class="border-round-sm square w-3rem"
												:style="{
													backgroundImage: `url(${
														accountStore.getAccountById(summary.account_id)?.Institution.logo
													})`,
													backgroundSize: 'cover',
												}"
											></div>
											<div class="text-semibold">
												{{ accountStore.getAccountName(summary.account_id) }}
											</div>
										</div>
										<div class="flex-grow-1"></div>
										<div class="flex align-items-center">
											<Currency
												:amount="isFuture ? summary.budgetedChange : summary.attributedChange"
												mode="net_change"
												hideCurrency
												class="font-medium"
											/>
											<small v-if="!isFuture" class="flex align-items-center">
												&nbsp;&nbsp;/&nbsp;
												<Currency :amount="summary.budgetedChange" mode="net_change" hideCurrency />
											</small>
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
							</template>
						</CollapseList>
					</div>
				</div>

				<br />
				<div>
					<div class="flex align-items-center py-2">
						<h3>Income</h3>
						<div class="flex-grow-1"></div>
						&emsp;
						<Currency
							:amount="
								isFuture
									? state.summaryData.incomeSummary.tally.budgetedNet
									: state.summaryData.incomeSummary.tally.attributedNet
							"
							mode="transaction"
							class="font-semibold"
						/>
						<small v-if="!isFuture" class="flex align-items-center"
							>&nbsp;&nbsp;/&nbsp;<Currency :amount="state.summaryData.incomeSummary.tally.budgetedNet"
						/></small>
					</div>
					<div class="list">
						<Accordion
							multiple
							@update:value="(value) => (openAccordions = new Set(value))"
							:value="Array.from(openAccordions)"
						>
							<template v-for="budgetSnapshot of state.summaryData.incomeSummary.budgets">
								<AccordionPanel
									v-if="budgetSnapshot.tally.hasInfo"
									:value="budgetSnapshot.budget.budget_id"
								>
									<AccordionHeader
										class="budget-header flex align-items-center gap-2"
										:class="{ shift: !isFuture && isAccordionOpen(budgetSnapshot.budget.budget_id) }"
									>
										<AttributionAvatar :category="budgetSnapshot.budget.Category" :size="2.5" />
										<b>{{ budgetSnapshot.budget.memo }}</b>
										<div class="flex-grow-1"></div>
										<div class="flex align-items-center gap-2">
											<div class="budget-total">
												<Currency
													:amount="
														isFuture
															? budgetSnapshot.tally.budgetedNet
															: budgetSnapshot.tally.attributedNet
													"
												/>
											</div>

											<Knob
												v-if="!isFuture"
												class="budget-progress-knob"
												v-model="budgetSnapshot.progress(ddate()).visualization.normalizedPercent"
												:min="0"
												:max="100"
												:size="25"
												:strokeWidth="15"
												:valueColor="savingsColor[budgetSnapshot.progress(ddate()).status]"
												:readonly="true"
												:showValue="false"
												style="padding-top: 5px"
											/>
										</div>
									</AccordionHeader>
									<AccordionContent>
										<!-- PROGRESS BAR -->
										<div v-if="!isFuture" class="flex align-items-center gap-3 my-2 w-full">
											<div class="flex-grow-1">
												<div
													class="budget-progress-bar bg-black-alpha-10"
													style="
														position: relative;
														padding: 4px 6px;
														width: 100%;
														border-radius: 4px;
													"
												>
													<div
														class="attributed-bar"
														:style="{
															position: 'absolute',
															top: '0',
															left: '0',
															width:
																Math.min(
																	100,
																	budgetSnapshot.progress(ddate()).visualization
																		.normalizedPercent
																) + '%',
															height: '100%',
															borderRadius: '4px',
															backgroundColor:
																savingsColor.muted[budgetSnapshot.progress(ddate()).status],
														}"
													></div>
													<div
														class="budget-line"
														v-if="
															budgetSnapshot.progress(ddate()).visualization
																.normalizedBudgetedNet < 99
														"
														:style="{
															position: 'absolute',
															top: '-2px',
															bottom: '-2px',
															left:
																budgetSnapshot.progress(ddate()).visualization
																	.normalizedBudgetedNet + '%',
															borderLeft: '1px solid ' + colors.gray8,
															translate: '-51%',
														}"
													></div>
													<div
														class="pace-marker"
														v-if="
															budgetSnapshot.progress(ddate()).visualization.normalizedPace <
															99
														"
														:style="{
															position: 'absolute',
															lineHeight: '0.3em',
															fontSize: '2em',
															translate: '-50% -100%',
															verticalAlign: 'top',
															top: '0',
															left:
																budgetSnapshot.progress(ddate()).visualization
																	.normalizedPace + '%',
														}"
													>
														▾
													</div>
													<div class="flex align-items-center relative">
														<div
															v-if="
																Math.abs(100 - budgetSnapshot.progress(ddate()).percent) > 1
															"
														>
															<Currency
																round
																:amount="Math.abs(budgetSnapshot.rangeBudgetRemaining)"
															/>
															{{
																budgetSnapshot.progress(ddate()).percent > 100
																	? 'over'
																	: 'remaining'
															}}
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
										<template
											v-for="event of isFuture
												? budgetSnapshot.budgetEvents
												: budgetSnapshot.notChildAttributions"
										>
											<CommonEventRow
												:event="event"
												@click="() => event.projectionDetails ? null : viewTransaction(event.attributionDetails!.sourceTransaction)"
												expand
											/>
										</template>
									</AccordionContent>
								</AccordionPanel>
							</template>
							<!-- OTHER INCOME -->
							<AccordionPanel
								value="other-income"
								v-if="state.summaryData.incomeSummary.tally.unBudgetedAttributions.length"
							>
								<AccordionHeader class="flex align-items-center gap-2">
									<AttributionAvatar icon="money-bag" :size="2.5" :background="'lime2'" />
									Other
									<div class="flex-grow-1"></div>
									<Currency :amount="state.summaryData.incomeSummary.tally.unBudgetedNet" />
								</AccordionHeader>
								<AccordionContent>
									<template v-for="(event, i) of state.summaryData.incomeSummary.tally.unBudgetedAttributions">
										<CommonEventRow
											:event="event"
											@click="() => event.projectionDetails ? null : viewTransaction(event.attributionDetails!.sourceTransaction)"
											expand
											hideBudget
										/>
									</template>
								</AccordionContent>
							</AccordionPanel>
						</Accordion>
					</div>
				</div>
				<br />

				<div>
					<div class="flex align-items-center py-2">
						<h3>Savings</h3>
						<div class="flex-grow-1"></div>
						<!-- ... -->
					</div>
					<div class="list">
						<Accordion
							multiple
							@update:value="(value) => (openAccordions = new Set(value))"
							:value="Array.from(openAccordions)"
						>
							<template v-for="budgetSnapshot of state.summaryData.transferSummary.budgets">
								<AccordionPanel :value="budgetSnapshot.budget.budget_id">
									<AccordionHeader
										class="budget-header flex align-items-center gap-2"
										:class="{ shift: !isFuture && isAccordionOpen(budgetSnapshot.budget.budget_id) }"
									>
										<AttributionAvatar :category="budgetSnapshot.budget.Category" :size="2.5" />
										<b>{{ budgetSnapshot.budget.memo }}</b>
										<div class="flex-grow-1"></div>
										<div class="flex align-items-center gap-2">
											<div class="budget-total">
												<Currency
													:amount="
														isFuture
															? budgetSnapshot.tally.budgetedNet
															: budgetSnapshot.tally.attributedNet
													"
												/>
											</div>

											<Knob
												v-if="!isFuture"
												class="budget-progress-knob"
												v-model="budgetSnapshot.progress(ddate()).visualization.normalizedPercent"
												:min="0"
												:max="100"
												:size="25"
												:strokeWidth="15"
												:valueColor="savingsColor[budgetSnapshot.progress(ddate()).status]"
												:readonly="true"
												:showValue="false"
												style="padding-top: 5px"
											/>
										</div>
									</AccordionHeader>
									<AccordionContent>
										<!-- PROGRESS BAR -->
										<div v-if="!isFuture" class="flex align-items-center gap-3 my-2 w-full">
											<div class="flex-grow-1">
												<div
													class="budget-progress-bar bg-black-alpha-10"
													style="
														position: relative;
														padding: 4px 6px;
														width: 100%;
														border-radius: 4px;
													"
												>
													<div
														class="attributed-bar"
														:style="{
															position: 'absolute',
															top: '0',
															left: '0',
															width:
																Math.min(
																	100,
																	budgetSnapshot.progress(ddate()).visualization
																		.normalizedPercent
																) + '%',
															height: '100%',
															borderRadius: '4px',
															backgroundColor:
																savingsColor.muted[budgetSnapshot.progress(ddate()).status],
														}"
													></div>
													<div
														class="budget-line"
														v-if="
															budgetSnapshot.progress(ddate()).visualization
																.normalizedBudgetedNet < 99
														"
														:style="{
															position: 'absolute',
															top: '-2px',
															bottom: '-2px',
															left:
																budgetSnapshot.progress(ddate()).visualization
																	.normalizedBudgetedNet + '%',
															borderLeft: '1px solid ' + colors.gray8,
															translate: '-51%',
														}"
													></div>
													<div
														class="pace-marker"
														v-if="
															budgetSnapshot.progress(ddate()).visualization.normalizedPace <
															99
														"
														:style="{
															position: 'absolute',
															lineHeight: '0.3em',
															fontSize: '2em',
															translate: '-50% -100%',
															verticalAlign: 'top',
															top: '0',
															left:
																budgetSnapshot.progress(ddate()).visualization
																	.normalizedPace + '%',
														}"
													>
														▾
													</div>
													<div class="flex align-items-center relative">
														<div
															v-if="
																Math.abs(100 - budgetSnapshot.progress(ddate()).percent) > 1
															"
														>
															<Currency
																round
																:amount="Math.abs(budgetSnapshot.rangeBudgetRemaining)"
															/>
															{{
																budgetSnapshot.progress(ddate()).percent > 100
																	? 'over'
																	: 'remaining'
															}}
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
										<template
											v-for="event of isFuture
												? budgetSnapshot.budgetEvents
												: budgetSnapshot.notChildAttributions"
										>
											<CommonEventRow
												:event="event"
												@click="() => event.projectionDetails ? null : viewTransaction(event.attributionDetails!.sourceTransaction)"
												expand
											/>
										</template>
									</AccordionContent>
								</AccordionPanel>
							</template>
							<!-- OTHER TRANSFERS -->
							<AccordionPanel
								value="other-transfers"
								v-if="state.summaryData.transferSummary.tally.unBudgetedAttributions.length"
							>
								<AccordionHeader class="flex align-items-center gap-2">
									<AttributionAvatar icon="transfer" :size="2.5" :background="'sky1'" />
									Other Transfers
									<div class="flex-grow-1"></div>
									<Currency
										:amount="state.summaryData.transferSummary.tally.unBudgetedNet"
										mode="net_change"
									/>
								</AccordionHeader>
								<AccordionContent>
									<template
										v-for="(event, i) of state.summaryData.transferSummary.tally.unBudgetedAttributions"
									>
										<CommonEventRow
											:event="event"
											@click="() => event.projectionDetails ? null : viewTransaction(event.attributionDetails!.sourceTransaction)"
											expand
											hideBudget
										/>
									</template>
								</AccordionContent>
							</AccordionPanel>
						</Accordion>
					</div>
				</div>
			</div>
			<!-- <Button label="Test Drawer" @click="() => showTestDrawer = true" /> -->
		</div>


		<TransactionDetailsDrawer ref="transactionDetailsDrawer" :key="viewingTransaction?.transaction_id" />

		<!-- Budget Editor Drawer -->
		<UpsertBudgetDrawer
			ref="upsertBudgetDrawer"
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

	<Dialog
		:visible="showTestDrawer"
		@hide="showTestDrawer = false"
	>
		TEST DRAWER
		<Button label="Close" @click="showTestDrawer = false" />
	</Dialog>
</template>

<style scoped lang="scss">
.column-layout {
	display: flex;
	gap: 2rem;

	&.mobile {
		flex-direction: column-reverse;
	}

	&:not(.mobile) > div {
		flex: 1;
		width: 50%;
	}
}

.list {
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.list-row {
	padding: 6px 0;
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

	&.shift {
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
	// .budget-progress-bar {
	// 	max-width: 0;
	// 	transition: 0.3s ease-in;
	// }
	// &.shift .budget-progress-bar {
	// 	max-width: 100% !important;
	// }
}
</style>
