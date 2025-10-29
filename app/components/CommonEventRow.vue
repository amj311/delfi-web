<script setup lang="ts">
import { computed, ref } from 'vue';
import AttributionAvatar from './AttributionAvatar.vue';
import Currency from './Currency.vue';
import Icon from './Icon.vue';
import { useAccountStore } from '@/stores/account.store';
import { useCategoryStore } from '@/stores/category.store';
import type { CommonEvent } from 'delfi-core/models/Summary';
import { useGroupStore } from '@/stores/group.store';
import { ddate } from 'delfi-core/utils/dateUtils';
import { colors } from 'delfi-core/utils/constants';
import SwipeAction from './utils/SwipeAction.vue';
import { TransactionService } from '@/services/transaction.service';
import { useToast } from './utils/Toast.vue';
import { jsonCopy, wait } from 'delfi-core/utils/miscUtils';
import TransactionAttributionDrawer from './TransactionAttributionDrawer.vue';
import type { Transaction } from 'delfi-core/models/Transaction';
import { UncategorizedCategory } from 'delfi-core/models/systemCategories';

const toast = useToast();

const {
	event,
	size = 2,
	currencyMode = 'transaction',
	clickable = true,
	dateFormat = 'full',
	...props
} = defineProps<{
	event: CommonEvent;
	size?: number;
	currencyMode?: 'transaction' | 'none' | 'net_change';
	hideDate?: boolean;
	hideBudget?: boolean;
	hideGroup?: boolean;
	showTransferCopy?: boolean;
	hideAccount?: boolean;
	clickable?: boolean;
	expand?: boolean;
	showPastDue?: boolean;
	dateFormat?: 'short' | 'full'
}>();

const showLoading = ref(false);

const isAttribution = computed(() => Boolean(event.attributionDetails));

const accountStore = useAccountStore();
const categoryStore = useCategoryStore();

const currencyModeComputed = computed(() => {
	if (!props.showTransferCopy && event.attributionDetails?.isTransferPair) {
		return 'none';
	}
	return currencyMode;
});

const isPending = computed(() => event.attributionDetails?.sourceTransaction.pending);
const isPastDue = computed(
	() => props.showPastDue && (event.projectionDetails?.windowEnd || event.date).isBefore(ddate())
);

const category = computed(() => categoryStore.getCategoryById(event.category_id));
const attributionText = computed<string>(() => (!props.hideBudget && event.Budget?.memo) || (category.value !== UncategorizedCategory && category.value?.name) || '');

const displayDate = computed(() => {
	if (!event.projectionDetails) {
		return event.date.format(dateFormat);
	} else if (event.projectionDetails.windowStart !== event.date || event.projectionDetails.windowEnd !== event.date) {
		return `${event.date.format(dateFormat)}-${event.projectionDetails.windowEnd.format(dateFormat)}`;
	}
	return event.date.format(dateFormat);
});

async function reviewTransaction() {
	if (!event.attributionDetails?.sourceTransaction) {
		return;
	}
	try {
		showLoading.value = true;
		const transaction = event.attributionDetails.sourceTransaction;
		await TransactionService.markTransactionReviewed(transaction.transaction_id);
		transaction.TransactionReview = {
			...transaction.TransactionReview!,
			reviewed_at: new Date(),
		};
		toast.add({
			severity: 'success',
			title: 'Transaction Reviewed',
		});
	} catch (error) {
		console.error('Error reviewing transaction:', error);
		toast.add({
			severity: 'error',
			title: 'Failed to mark transaction as reviewed.',
		});
	} finally {
		showLoading.value = false;
	}
}

const leftAction = computed(() => {
	if (isAttribution.value) {
		const reviewRecord = event.attributionDetails?.sourceTransaction.TransactionReview;
		if (reviewRecord && !reviewRecord.reviewed_at) {
			return reviewTransaction;
		}
	}
	return undefined;
});

</script>

<template>
	<div class="event-row" :class="{ expand }">
		<SwipeAction
			v-if="showTransferCopy || !event.attributionDetails?.isTransferCopy"
			:onLeft="leftAction"
			leftBackground="var(--p-sky-300)"
		>
			<template #content>
				<div
					class="event-row-inner flex align-items-center gap-3"
					:class="{ 'opacity-70': isPending, clickable }"
				>
					<!-- Avatar with badges -->
					<div class="loading-center relative">
						<AttributionAvatar :event="event" :size="size" :style="{ opacity: showLoading ? 0.5 : 1 }">
							<template #badge v-if="event.attributionDetails?.isSplit">
								<Icon source_id="arrow_split" source="material-symbols" />
							</template>
							<template #badge v-if="event.attributionDetails?.isTransferPair">
								<Icon source_id="sync_alt" source="material-symbols" />
							</template>
							<template #badge v-if="event.projectionDetails">
								<i class="pi pi-wallet" style="font-size: 0.95em" />
							</template>
						</AttributionAvatar>
						<i v-if="showLoading" class="pi pi-spin pi-spinner absolute-center" />
					</div>

					<!-- Main content area -->
					<div class="flex flex-column w-full min-w-0">
						<!-- Line 1: Transaction name + amount -->
						<div class="flex align-items-center gap-2">
							<div class="flex align-items-center w-full min-w-0">
								<div class="text-ellipsis">
									<span class="font-medium" :class="{ 'review-bold': event.attributionDetails?.needsReview }">{{
										event.displayName
									}}</span>
									<small v-if="event.attributionDetails?.memo">
										&nbsp; {{ event.attributionDetails.softDescription }}
									</small>
								</div>
							</div>
							<div style="flex-grow: 1"></div>
							<div
								class="font-medium flex align-items-center gap-1"
								:class="{ 'review-bold': event.attributionDetails?.needsReview }"
							>
								<Icon
									v-if="!props.showTransferCopy && event.attributionDetails?.isTransferPair"
									source_id="sync_alt"
									source="material-symbols"
								/>
								<Currency :amount="event.amount" :mode="currencyModeComputed" />
							</div>
						</div>

						<!-- Line 2: Budget/Category - Account [→ Transfer Target] + Date -->
						<div class="flex align-items-center gap-2">
							<small class="text-ellipsis">
								<template v-if="event.Group && !hideGroup">
									<small><Icon name="tag" /></small>
									{{ useGroupStore().getGroupById(event.Group.group_id)?.name }}
									{{ hideAccount ? '' : '-' }} 
								</template>
								<template v-if="!hideBudget && category?.type === 'EXPENSE' && !event.Budget">
									<i class="pi pi-exclamation-triangle" />
									Unbudgeted {{ hideAccount ? '' : '-' }}
								</template>
								<template v-if="attributionText">{{ attributionText }} {{ hideAccount ? '' : '-' }} </template>
								<template v-if="!hideAccount">
									{{ accountStore.getAccountName(event.account_id) }}
									<template v-if="event.attributionDetails?.isTransferPair">
										→
										{{
											accountStore.getAccountName(
												event.attributionDetails?.sourceTransaction.TransferPair!.account_id
											)
										}}
									</template>
								</template>
								
							</small>
							<div class="flex-grow-1"></div>
							<small
								class="white-space-nowrap"
								v-if="!hideDate && !isPending"
								:style="{ color: isPastDue ? colors.yellow3 : '' }"
							>
								<!-- <span v-if="isPastDue">Expected</span> -->
								{{ displayDate }}
							</small>
							<small v-if="isPending">PENDING</small>
						</div>
					</div>

					<div v-if="event.attributionDetails?.needsReview" class="review-dot" />
				</div>
			</template>
			<template #left>
				<i class="pi pi-check-circle" />
			</template>
			<template #right>
				<Icon name="category" />
			</template>
		</SwipeAction>
		<!-- <TransactionAttributionDrawer ref="transactionAttributionDrawer" /> -->
	</div>
</template>

<style scoped lang="scss">
.event-row {
	--padding-x: 8px;

	&.expand {
		margin-left: calc(var(--padding-x) * -1);
		margin-right: calc(var(--padding-x) * -1);
	}
	
	.event-row-inner {
		position: relative;
		padding: 6px var(--padding-x);


		&:not(:last-child) {
			border-bottom: 1px solid #eee;
		}

		&.clickable {
			cursor: pointer;
			&:hover {
				background-color: var(--color-background-soft);
			}
		}

		.review-bold {
			font-weight: 600 !important;
		}

		.review-dot {
			position: absolute;
			top: 4px;
			left: 4px;
			width: 10px;
			aspect-ratio: 1;
			border-radius: 50%;
			background-color: rgb(80, 198, 238);
		}
	}

}
</style>
