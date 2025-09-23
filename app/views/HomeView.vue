<script setup lang="ts">
import AttributionAvatar from '@/components/AttributionAvatar.vue';
import CommonEventRow from '@/components/CommonEventRow.vue';
import Currency from '@/components/Currency.vue';
import { useAccountStore } from '@/stores/account.store';
import { useDelfiStore } from '@/stores/delfi.store';
import type { ProjectionEvent } from 'delfi-core/models/Budget';
import { ddate } from 'delfi-core/utils/dateUtils';
import { computed, ref, watch } from 'vue';


const upcomingBudgets = ref<ProjectionEvent[]>([]);

watch(() => useDelfiStore().isGeneratingForecast, async () => {
	if (!useDelfiStore().delfi || useDelfiStore().isInitializing || useDelfiStore().isGeneratingForecast) {
		return [];
	}
	const thisMonth = ddate().startOf('month');
	const nextMonth = thisMonth.add(1, 'month');
	const thisMonthSummary = await useDelfiStore().getMonthSummary(thisMonth);
	const nextMonthSummary = await useDelfiStore().getMonthSummary(nextMonth);
	const allUnfinished = [
		...thisMonthSummary.forecast.unfinishedBudgetEvents,
		...nextMonthSummary.forecast.unfinishedBudgetEvents,
	]

	// from the previous or next two weeks
	upcomingBudgets.value = allUnfinished.filter(e => e.date >= ddate().subtract(1, 'week') && e.date <= ddate().add(2, 'week'));
}, { immediate: true });
</script>

<template>
	<br />
	<h3>Accounts</h3>
	<div v-for="account in useAccountStore().accounts" :key="account.account_id">
		<div class="flex align-items-center gap-2 border-bottom-1 border-gray-200 py-2" @click="() => $router.push(`/accounts/${account.account_id}`)" style="cursor: pointer;">
			<AttributionAvatar :image="account.Institution.logo":size="2.5" square />
			<div class="flex flex-column">
				<div>
					<span class="font-semibold">{{ account.display_name || account.external_name }}</span>**** {{ account.mask }}
				</div>
				<small>{{ ddate(account.last_successful_sync).fromNow() }}</small>
			</div>
			<div class="flex-grow-1"></div>
			<Currency :amount="account.current_balance" mode="balance" class="font-medium" />
		</div>
	</div>


	<template v-if="upcomingBudgets.length">
		<br />
		<h3>Upcoming Budgets</h3>
		<CommonEventRow v-for="event in upcomingBudgets" :event="event" />
	</template>
</template>