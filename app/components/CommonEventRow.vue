<script setup lang="ts">
import { computed } from 'vue';
import AttributionAvatar from './AttributionAvatar.vue';
import Currency from './Currency.vue';
import Icon from './Icon.vue';
import { useAccountStore } from '@/stores/account.store';
import { useCategoryStore } from '@/stores/category.store';
import type { CommonEvent } from 'delfi-core/models/Summary';

interface Props {
	event: CommonEvent;
	size?: number;
	currencyMode?: 'transaction' | 'none' | 'net_change';
	hideDate?: boolean;
	hideBudget?: boolean;
	showTransferCopy?: boolean;
	hideAccount?: boolean;
	clickable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	size: 1.9,
	currencyMode: 'transaction',
	clickable: true,
});

const accountStore = useAccountStore();
const categoryStore = useCategoryStore();

const currencyModeComputed = computed(() => {
	if (!props.showTransferCopy && props.event.attributionDetails?.isTransferPair) {
		return 'none';
	}
	return props.currencyMode;
});

const isPending = computed(() => props.event.attributionDetails?.sourceTransaction.pending);
</script>

<template>
	<div
		v-if="showTransferCopy || !event.attributionDetails?.isTransferCopy"
		class="event-row flex align-items-center gap-3 py-2"
		:class="{ 'opacity-70': isPending, clickable }"
	>
		<!-- Avatar with badges -->
		<AttributionAvatar :event="event" :size="size">
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

		<!-- Main content area -->
		<div class="flex flex-column w-full min-w-0">
			<!-- Line 1: Transaction name + amount -->
			<div class="flex align-items-center gap-2">
				<div class="flex align-items-center w-full min-w-0">
					<div class="text-ellipsis">
						<span class="font-medium" :class="{'review-bold': event.attributionDetails?.needsReview}">{{ event.displayName }}</span>
						<small v-if="event.attributionDetails?.memo"> &nbsp;- {{ event.attributionDetails.softDescription }} </small>
					</div>
				</div>
				<div style="flex-grow: 1"></div>
				<div class="font-medium flex align-items-center gap-1" :class="{'review-bold': event.attributionDetails?.needsReview}">
					<Icon v-if="!props.showTransferCopy && event.attributionDetails?.isTransferPair" source_id="sync_alt" source="material-symbols" />
					<Currency :amount="event.amount" :mode="currencyModeComputed" />
				</div>
			</div>

			<!-- Line 2: Budget/Category - Account [→ Transfer Target] + Date -->
			<div class="flex align-items-center gap-2">
				<small class="text-ellipsis">
					{{ (!hideBudget && event.Budget?.memo) || categoryStore.getCategoryById(event.category_id).name }}
					<template v-if="!hideAccount">
						-
						{{ accountStore.getAccountName(event.account_id) }}
						<template v-if="event.attributionDetails?.isTransferPair">
							→
							{{ accountStore.getAccountName(event.attributionDetails?.sourceTransaction.TransferPair!.account_id) }}
						</template>
					</template>
				</small>
				<div class="flex-grow-1"></div>
				<small class="white-space-nowrap" v-if="!hideDate && !isPending">
					{{ event.date.formatShort() }}
				</small>
				<small v-if="isPending">PENDING</small>
			</div>
		</div>


		<div v-if="event.attributionDetails?.needsReview" class="review-dot" />
	</div>
</template>

<style scoped lang="scss">
.event-row {
	position: relative;
}

.review-bold {
	font-weight: 600 !important;
}

.event-row:not(:last-child) {
	border-bottom: 1px solid #eee;
}

.clickable {
	cursor: pointer;
	&:hover {
		background-color: var(--color-background-soft);
	}
}


.review-dot {
	position: absolute;
	top: 8px;
	left: -4px;
	width: 10px;
	aspect-ratio: 1;
	border-radius: 50%;
	background-color: rgb(80, 198, 238);
}
</style>