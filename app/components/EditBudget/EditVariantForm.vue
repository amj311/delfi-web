<script setup lang="ts">
import Select from 'primevue/select';
import type { ScheduleVariant } from 'delfi-core/models/Budget';
import InputCurrency from '../InputCurrency.vue';
import BudgetScheduleForm from './BudgetScheduleForm.vue';
import FilterBuilder from '../FilterBuilder.vue';
import InputNumber from 'primevue/inputnumber';
import { computed, onMounted, ref, watch } from 'vue';
import Button from 'primevue/button';
import Textarea from 'primevue/textarea';
import BudgetProjectionForm from './BudgetProjectionForm.vue';

const variant = defineModel<ScheduleVariant>();
const props = defineProps<{
	withNotes?: boolean,
}>();


const amountTypeOptions = [
	{ label: 'Fixed', value: 'fixed' },
	{ label: 'Triggered', value: 'triggered' },
	{ label: 'Seasonal', value: 'seasonal' },
];

const triggerOperatorOptions = [
	{ label: 'exactly', value: 'exactly' },
	{ label: 'amount plus', value: 'add' },
	{ label: 'amount minus', value: 'sub' },
	{ label: 'amount times', value: 'mult' },
	{ label: 'amount divided by', value: 'div' },
	{ label: 'percent of amount:', value: 'percent' },
];

const MonthNames = [
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December',
] as const;

if (variant.value && !variant.value.schedule.interval) {
	variant.value.schedule.interval = 1;
}

/**
 * Prepare default values for amountTemplate types
 */
watch(() => variant.value?.amountTemplate.type, () => {
	const newType = variant.value?.amountTemplate.type;

	if (!variant.value || !newType) {
		return;
	}

	if (newType === 'triggered' && !variant.value.amountTemplate.trigger) {
		variant.value.amountTemplate.trigger = {
			computation: {
				operand: 0,
				operator: 'add'
			},
			filter: null,
			type: 'immediateMatch',
		}
	}

	if (newType === 'seasonal' && !variant.value.amountTemplate.monthAmounts) {
		variant.value.amountTemplate.monthAmounts = {
			0: 0,
			1: 0,
			2: 0,
			3: 0,
			4: 0,
			5: 0,
			6: 0,
			7: 0,
			8: 0,
			9: 0,
			10: 0,
			11: 0,
		}
	}
})

const clickedAddNote = ref(false);
const showNoteField = computed(() => variant.value?.notes || clickedAddNote.value);

</script>

<template>
	<div v-if="variant" class="flex-column gap-4">
		<!-- {{ variant.amountTemplate }} -->

		<!-- AMOUNT -->
		<div class="flex-column gap-2">
			<div class="flex-row-center">
				<label for="amount-type" class="block font-bold flex-1">Amount</label>
				<Select
					id="amount-type"
					v-model="variant.amountTemplate.type"
					:options="amountTypeOptions"
					optionValue="value"
					optionLabel="label"
					show-search
				/>
			</div>

			<!-- Fixed amount -->
			<div v-if="variant.amountTemplate.type === 'fixed'" class="flex">
				<InputCurrency v-model="variant.amountTemplate.amount" />
			</div>

			<!-- Seasonal amounts -->
			<div v-if="variant.amountTemplate.type === 'seasonal'" class="month-amount-grid">
				<div v-for="month,i in MonthNames" :key="month" class="flex-row-center">
					<label :for="`month-${month}`" :style="{ flex: '0 0 2rem' }">{{ month.slice(0,3) }}</label>
					<InputCurrency
						:inputId="`month-${month}`"
						v-model="variant.amountTemplate.monthAmounts[i]"
						:style="{ flex: '0 0 7rem' }"
					/>
				</div>
			</div>

			<!-- Triggered amount -->
			<div v-if="variant.amountTemplate.type === 'triggered' && variant.amountTemplate.trigger" class="flex flex-column gap-3">
				<div>For every transaction where...</div>
				<FilterBuilder v-model="variant.amountTemplate.trigger.filter" />

				<div class="flex-row-center gap-2">
					...budget for
					<Select :options="triggerOperatorOptions" optionLabel="label" optionValue="value" v-model="variant.amountTemplate.trigger.computation.operator" />
					<InputNumber v-if="['percent', 'div', 'mult'].includes(variant.amountTemplate.trigger.computation.operator)" style="width: 7em" v-model="variant.amountTemplate.trigger.computation.operand"/>
					<InputCurrency v-else :style="{ flex: '0 0 7rem' }" v-model="variant.amountTemplate.trigger.computation.operand"/>
				</div>
				<!-- {{ variant.amountTemplate.trigger.computation }} -->
			</div>
		</div>

		<div class="flex-column gap-2">
			<label for="amount-type" class="block font-bold flex-1">Timeline</label>
			<BudgetScheduleForm v-model="variant.schedule" />
			<BudgetProjectionForm v-model="variant.projectionSchedule" />
		</div>

		<div v-if="withNotes">
			<div v-if="showNoteField">
				<label for="budget-notes" class="block text-sm mb-1">NOTE</label>
				<Textarea
					id="budget-notes"
					v-model="variant.notes"
					class="w-full"
					rows="3"
					placeholder="Optional notes about this variant..."
				/>
			</div>
			<Button v-if="!showNoteField" text icon="pi pi-pencil" label="Add note" @click="clickedAddNote = true" />
		</div>
	</div>
</template>

<style scoped lang="scss">
.month-amount-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
	gap: 0.5rem;

	> div {
		justify-content: center;
	}
}
</style>
