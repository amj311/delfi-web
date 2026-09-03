<script setup lang="ts">
import { computed, ref } from 'vue';
import Select from 'primevue/select';
import { ddate } from 'delfi-core/utils/dateUtils.js';
import type { BudgetProjectionSchedule } from 'delfi-core/models/Budget';
import { isFullArray } from 'delfi-core/utils/miscUtils';
import MultiSelect from 'primevue/multiselect';
import { WEEKDAYS } from 'delfi-core/models/schedules/Schedule';

const projection = defineModel<BudgetProjectionSchedule | null>();

const frequencyOptions = [
	{ label: 'week', value: 'WEEKLY' },
	{ label: 'month', value: 'MONTHLY' },
	{ label: 'year', value: 'YEARLY' },
];

const detectedStyle = computed(() => {
	if (!projection.value) return 'standard';
	if (isFullArray(projection.value.byDayOfMonth)) return 'dayOfMonth';
	if (isFullArray(projection.value.byDayOfWeek)) return 'dayOfWeek';
	if (projection.value.frequency && projection.value.interval) return 'interval';
	return 'standard';
})

const projectionStyles: Record<string, { value: string, label: string, default: BudgetProjectionSchedule | null }> = {
	standard: { value: 'standard', label: 'Standard', default: null },
	dayOfMonth: { value: 'dayOfMonth', label: 'Specific days of the month', default: { byDayOfMonth: [1] } },
	dayOfWeek: { value: 'dayOfWeek', label: 'Specific days of the week', default: { byDayOfWeek: ['MO'] } },
	interval: { value: 'interval', label: 'Regular intervals', default: { interval: 1, frequency: 'WEEKLY' } },
};

function changeStyle({ value }: { value: string }) {
	const defaultSettings = projectionStyles[value]?.default;
	projection.value = defaultSettings;
}

</script>

<template>
	<div class="flex-column gap-2">
		<div class="flex-row-center gap-2">
			Projection style:
			<div class="flex-1" />
			<Select :modelValue="detectedStyle" :options="Object.values(projectionStyles)" optionLabel="label" optionValue="value" @change="changeStyle" />
		</div>

		<template v-if="projection">
			<div v-if="detectedStyle === 'dayOfMonth'" class="flex-row-center justify-content-end gap-2">
				Days:
				<MultiSelect :options="Array.from({length: 30}).map((_, i) => i + 1)" v-model="projection.byDayOfMonth" />
			</div>

			<div v-if="detectedStyle === 'dayOfWeek'" class="flex-row-center justify-content-end gap-2">
				Days:
				<MultiSelect :options="Object.values(WEEKDAYS)" optionLabel="abbreviation" optionValue="value" v-model="projection.byDayOfWeek" />
			</div>


			<div v-if="detectedStyle === 'interval'" class="flex-row-center justify-content-end gap-2">
				Occurs every
				<Select :defaultValue="1" :options="Array.from({length: 12}).map((_, i) => i + 1)" v-model="projection.interval" />
				<Select :options="frequencyOptions" :optionLabel="(o) => o.label + (projection?.interval === 1 ? '' : 's')" optionValue="value" v-model="projection.frequency" />
			</div>
		</template>
	</div>
</template>

<style scoped lang="scss">
/* PrimeVue Drawer overrides if needed */
</style>
