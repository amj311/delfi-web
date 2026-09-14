<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Select from 'primevue/select';
import { ddate, type DelfiDate } from 'delfi-core/utils/dateUtils.js';
import type { BudgetOccurrenceSchedule } from 'delfi-core/models/Budget';

const schedule = defineModel<BudgetOccurrenceSchedule>();

const startString = ref(schedule.value?.start.toString());
watch(() => startString.value, () => {
	if (schedule.value) {
		schedule.value.start = ddate(startString.value);
	}
})

const frequencyOptions = [
	{ label: 'week', value: 'WEEKLY' },
	{ label: 'month', value: 'MONTHLY' },
	{ label: 'year', value: 'YEARLY' },
];

// For full projection, budgets must start and end on the first day of their cadence interval
const startOptions = computed(() => {
	const dates: Array<DelfiDate> = [];
	const unit = schedule.value?.frequency === 'WEEKLY'
		? 'week'
		: schedule.value?.frequency === 'MONTHLY'
		? 'month'
		: 'year';

	// give a few years radius of options
	const yearRadius = 3;
	let date = ddate(schedule.value?.start).subtract(yearRadius, 'years').startOf(unit);
	const finalDate = ddate().add(yearRadius, 'years').startOf(unit);
	while (date.isBefore(finalDate)) {
		dates.push(date);
		date = date.add(1, unit);
	}

	const format = schedule.value?.frequency === 'WEEKLY'
		? 'MMM D, YYYY'
		: schedule.value?.frequency === 'MONTHLY'
		? 'MMMM YYYY'
		: 'YYYY';

	return dates.map(date => ({
		string: date.toString(),
		label: date.format(format),
	}));
})

// update start when cadence changes
watch(() => schedule.value?.frequency, () => {
	if (!schedule.value?.start) return;

	const unit = schedule.value.frequency === 'WEEKLY'
		? 'week'
		: schedule.value.frequency === 'MONTHLY'
		? 'month'
		: 'year';

	startString.value = ddate(schedule.value.start).startOf(unit).toString();
}, { immediate: true })


const ends = computed(() => Boolean(schedule.value?.end));

</script>

<template>
	<!-- TODO implement UI that helps enforce variant time boundaries -->
	<!-- ie changing one date to adjust the abutted ends together -->
	<div v-if="schedule" class="flex-column gap-2">
		<div class="flex-row-center gap-2">
			Cadence:
			<div class="flex-1" />
			<Select :defaultValue="1" :options="Array.from({length: 12}).map((_, i) => i + 1)" v-model="schedule.interval" />
			<Select :options="frequencyOptions" :optionLabel="(o) => o.label + (schedule?.interval === 1 ? '' : 's')" optionValue="value" v-model="schedule.frequency" />
		</div>
		
		<div class="flex-row-center">
			<div>Starts:</div>

			<div class="flex-1"></div>
			<Select
				v-model="startString"
				:options="startOptions"
				optionValue="string"
				optionLabel="label"
			/>
		</div>

		<div class="flex-row-center gap-3">
			<div>Ends:</div>

			<div class="flex-1"></div>

			<div class="flex-row-center gap-1" @click="delete schedule.end">
				<input type="radio" :checked="!ends" /><label>Never</label>
			</div>

			<div class="flex-row-center gap-1">
				<input type="radio" :checked="ends" :disabled="!ends" />
				<label>
					On
					<input
						type="date"
						class="p-inputtext"
						:value="schedule.end ? ddate(schedule.end).toString() : undefined"
						@change="(e: any) => { schedule!.end = ddate(e.target.value); ends = true }"
					/>
				</label>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
/* PrimeVue Drawer overrides if needed */
</style>
