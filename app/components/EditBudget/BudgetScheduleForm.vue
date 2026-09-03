<script setup lang="ts">
import { computed, ref } from 'vue';
import Select from 'primevue/select';
import { ddate } from 'delfi-core/utils/dateUtils.js';
import type { BudgetOccurrenceSchedule } from 'delfi-core/models/Budget';

const schedule = defineModel<BudgetOccurrenceSchedule>();

const frequencyOptions = [
	{ label: 'week', value: 'WEEKLY' },
	{ label: 'month', value: 'MONTHLY' },
	{ label: 'year', value: 'YEARLY' },
];

const ends = computed(() => Boolean(schedule.value?.end));

</script>

<template>
	<!-- TODO implement UI that helps enforce variant time boundaries -->
	<!-- ie changing one date to adjust the abutted ends together -->
	<div v-if="schedule" class="flex-column gap-2">
		<div class="flex-row-center">
			<div>Starts:</div>

			<div class="flex-1"></div>
			<input
				type="date"
				class="p-inputtext"
				:value="ddate(schedule.start).toString()"
				@change="(e: any) => schedule!.start = ddate(e.target.value)"
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
	
		<div class="flex-row-center gap-2">
			Resets every
			<div class="flex-1" />
			<Select :defaultValue="1" :options="Array.from({length: 12}).map((_, i) => i + 1)" v-model="schedule.interval" />
			<Select :options="frequencyOptions" :optionLabel="(o) => o.label + (schedule?.interval === 1 ? '' : 's')" optionValue="value" v-model="schedule.frequency" />
		</div>
	</div>
</template>

<style scoped lang="scss">
/* PrimeVue Drawer overrides if needed */
</style>
