<script setup lang="ts">
import { useDelfiStore } from '@/stores/delfi.store';
import { ddate, type DelfiDate } from 'delfi-core/utils/dateUtils';
import Button from 'primevue/button';
import { ref, computed } from 'vue';

const props = defineProps<{
	activeMonth: DelfiDate | null,
	onSelect: (date: DelfiDate) => void,
}>();

// Calculate dates for the past 12 months (including the current one)
const monthsToShow: Array<DelfiDate> = [];
for (let i = 0; i < 12; i++) {
  const date = ddate().startOf('month').set('month', ddate().month() - i);
  monthsToShow.push(date);
}

const canGoBack = computed(() => {
	if (!props.activeMonth) {
		return false;
	}
	// return props.activeMonth.isAfter(delfiStore.delfi.start);
	return true;
});

const canGoForward = computed(() => {
	if (!props.activeMonth) {
		return false;
	}
	return props.activeMonth.isBefore(useDelfiStore().delfi.end.subtract(1, 'month'));
});


const goForward = async () => {
	if (!canGoForward.value) {
		return;
	}
	if (!props.activeMonth) {
		return;
	}
	const newMonth = ddate(props.activeMonth.add(1, 'month'));
	selectMonth(newMonth);
};

const goBack = async () => {
	if (!canGoBack.value) {
		return;
	}
	if (!props.activeMonth) {
		return;
	}
	const newMonth = ddate(props.activeMonth.subtract(1, 'month'));
	selectMonth(newMonth);
};


// Function to handle month selection change
function selectMonth(monthItem: DelfiDate) {
    console.log('Selected month:', monthItem.toString());
    props.onSelect(monthItem)
}
</script>

<template>
	<div class="flex-column gap-2">
		<div class="month-selector flex-row-center hide-scroll">
			<div
				v-for="(month, index) in monthsToShow" 
			>
				<Button 
					:key="index" 
					@click="selectMonth(month)" 
					:class="['month-button']"
					:label="month.format('MMM')"
					:severity="month.isSame(activeMonth) ? undefined : 'secondary'"
				/>
			</div>
		</div>
		<div class="bg flex align-items-center justify-content-between">
			<Button text @click="goBack()">Back</Button>
			<span>{{ activeMonth?.format('MMMM YYYY') }}</span>
			<Button text @click="goForward()">Forward</Button>
		</div>
	</div>
</template>

<style scoped>
/* Styling for the month selector */
.month-selector {
  flex-direction: row-reverse;
  gap: 10px;
  overflow-x: auto;
}
</style>