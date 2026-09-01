<script setup lang="ts">
import Select from 'primevue/select';
import type { ScheduleVariant } from 'delfi-core/models/Budget';
import InputCurrency from './InputCurrency.vue';
import EditScheduleForm from './EditScheduleForm.vue';
import FilterBuilder from './FilterBuilder.vue';
import InputNumber from 'primevue/inputnumber';

const variant = defineModel<ScheduleVariant>();

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

const MONTHS = [
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December',
] as const;

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
				<div v-for="month,i in MONTHS" :key="month" class="flex-row-center">
					<label :for="`month-${month}`" :style="{ flex: '0 0 2rem' }">{{ month.slice(0,3) }}</label>
					<InputCurrency
						:inputId="`month-${month}`"
						v-model="variant.amountTemplate.monthAmounts[i]"
						:style="{ flex: '0 0 7rem' }"
					/>
				</div>
			</div>

			<!-- Triggered amount -->
			<div v-if="variant.amountTemplate.type === 'triggered'" class="flex flex-column gap-3">
				<div>For every transaction where...</div>
				<FilterBuilder v-model="variant.amountTemplate.trigger.filter" />

				<div class="flex-row-center gap-2">
					...budget for
					<Select :options="triggerOperatorOptions" optionLabel="label" optionValue="value" v-model="variant.amountTemplate.trigger.computation.operator" />
					<InputNumber v-if="['percent', 'div', 'mult'].includes(variant.amountTemplate.trigger.computation.operator)" style="width: 7em" v-model="variant.amountTemplate.trigger.computation.operand"/>
					<InputCurrency v-else style="width: 7em" v-model="variant.amountTemplate.trigger.computation.operand"/>
				</div>
				<!-- {{ variant.amountTemplate.trigger.computation }} -->
				  
				<!-- <div>
					<label for="trigger-operand" class="block font-bold mb-1">Operand</label>
					<InputNumber
						id="trigger-operand"
						v-model="variant.amountTemplate.trigger.computation.operand"
						class="w-full"
						:step="1"
					/>
				</div> -->
				<!-- <div>
					<label for="trigger-filter" class="block font-bold mb-1">Filter (JSON stub)</label>
					<Textarea
						id="trigger-filter"
						v-model="variant.amountTemplate.trigger.filter"
						class="w-full font-mono text-sm"
						rows="3"
					/>
				</div> -->
			</div>

		</div>
		
		<label for="amount-type" class="block font-bold flex-1">Timeline</label>
		<EditScheduleForm v-model="variant.schedule" />
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
