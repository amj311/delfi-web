<script setup lang="ts">
import { ref } from 'vue';
import Select from 'primevue/select';
import type { SingleSchedule } from 'delfi-core/models/schedules/Schedule.js';
import { ddate } from 'delfi-core/utils/dateUtils.js';

const schedule = defineModel<SingleSchedule>();

const frequencyOptions = [
	{ label: 'week', value: 'WEEKLY' },
	{ label: 'month', value: 'MONTHLY' },
	{ label: 'year', value: 'YEARLY' },
];

const ends = ref(Boolean(schedule.value?.end));

</script>

<template>
	<div v-if="schedule" class="flex-column gap-2">
		<div class="flex-row-center">
			<div>Starts:</div>

			<div class="flex-1"></div>
			<input
				type="date"
				:value="ddate(schedule.start).toString()"
				@change="(e: any) => schedule!.start = ddate(e.target.value)"
			/>
		</div>

		<div class="flex-row-center gap-3">
			<div>Ends:</div>

			<div class="flex-1"></div>

			<div class="flex-row-center gap-1" @click="delete schedule.end">
				<input type="radio" id="ends-never" name="ends" :checked="!ends" /><label for="ends-never">Never</label>
			</div>

			<div class="flex-row-center gap-1">
				<input type="radio" id="ends-on" name="ends" :checked="ends" :disabled="!ends" />
				<label for="ends-on">
					On
					<input
						type="date"
						:value="schedule.end ? ddate(schedule.end).toString() : undefined"
						@change="(e: any) => { schedule!.end = ddate(e.target.value); ends = true }"
					/>
				</label>
			</div>
		</div>
	
		<div class="flex-row-center gap-2">
			Resets every
			<Select :defaultValue="1" :options="Array.from({length: 12}).map((_, i) => i + 1)" v-model="schedule.interval" />
			<Select :options="frequencyOptions" :optionLabel="(o) => o.label + (schedule?.interval === 1 ? '' : 's')" optionValue="value" v-model="schedule.frequency" />
		</div>
	</div>
</template>

<style scoped lang="scss">
/* PrimeVue Drawer overrides if needed */
</style>
