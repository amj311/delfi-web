<script setup lang="ts">
import { OperatorDescriptions, Operators, Properties, type EitherFilter as EitherBlock, type FilterBlock, type Predicate, type TransactionFilter } from 'delfi-core/models/Filters';
import Button from 'primevue/button';
import Select from 'primevue/select';
import { computed, ref, useAttrs, watch } from 'vue';
import AttributionAvatar from './AttributionAvatar.vue';
import { useMerchantStore } from '@/stores/merchant.store';
import MerchantSelectionDrawer from './MerchantSelectionDrawer.vue';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import CategorySelectionDrawer from './CategorySelectionDrawer.vue';
import { useCategoryStore } from '@/stores/category.store';
import MerchantButton from './MerchantButton.vue';
import CategoryButton from './CategoryButton.vue';
import BudgetButton from './BudgetButton.vue';
import AccountButton from './AccountButton.vue';

const filter = defineModel<TransactionFilter>();
const draft = ref<EitherBlock>(filter.value || { AND: [] });

watch(filter, (newVal) => {
	if (newVal && JSON.stringify(newVal) !== JSON.stringify(draft.value)) {
		draft.value = newVal as EitherBlock;
	}
}, { immediate: true });

watch(draft, (newVal) => {
	if (!newVal) {
		newVal = { AND: []};
	}
	filter.value = newVal as TransactionFilter;
});

const PropertyOptions = Object.entries(Properties).map(([key, prop]) => ({ label: prop.label, value: key }));
const OperatorOptions = Operators.map((op) => ({ label: OperatorDescriptions[op] || op, value: op }));

function blockType(filter: EitherBlock) {
	return ('AND' in filter) ? 'AND' : 'OR';
}

function swapBlockType(rule: EitherBlock) {
	const currentType = blockType(rule);
	const newType = 'AND' in rule ? 'OR' : 'AND';
	rule[newType] = rule[currentType];
	delete rule[currentType];
}

function removeRule(rule: FilterBlock, parent: EitherBlock) {
	const array = parent.AND || parent.OR;
	const index = array!.indexOf(rule);
	if (index !== -1) {
		array!.splice(index, 1);
	}
}

function addRule(rule: FilterBlock, parent: EitherBlock) {
	const array = parent.AND || parent.OR;
	array!.push(rule);
}

</script>

<template>
	<div v-for="block in [draft]">
		<div v-for="(rule, i) in block.AND || block.OR" class="track-row">
			<!-- Track -->
			<div v-if="i === 1" class="track start">
				<Button outlined :severity="blockType(block) === 'AND' ? 'info' : 'warn'" size="small" :label="blockType(block)" @click="() => swapBlockType(block)" />
			</div>
			<div v-else-if="i > 1" class="track"></div>

			<div v-if="rule && 'property' in rule" class="flex align-items-start gap-2 w-full">
				<div class="flex align-items-center gap-2 flex-wrap">
					<Select
						:options="PropertyOptions"
						option-label="label"
						option-value="value"
						v-model="rule.property"
						@change="() => (rule.operator = Properties[rule.property]?.allowedOperators?.[0] || Operators[0])"
						placeholder="Property..."
					/>
					<Select
						v-if="rule.property"
						:options="
							OperatorOptions.filter(
								(op) => !Properties[rule.property].allowedOperators || Properties[rule.property].allowedOperators.some((o) => o === op.value)
							)
						"
						option-label="label"
						option-value="value"
						v-model="rule.operator"
						@change="() => (rule.operand = null)"
					/>
					<template v-if="rule.operator">
						<MerchantButton v-if="Properties[rule.property].type === 'merchant_id'" v-model="rule.operand" />
						<CategoryButton v-if="Properties[rule.property].type === 'category_id'" v-model="rule.operand" />
						<AccountButton v-if="Properties[rule.property].type === 'account_id'" v-model="rule.operand" />
						<BudgetButton v-if="Properties[rule.property].type === 'budget_id'" v-model="rule.operand" />

						<!-- <InputNumber v-if="Properties[rule.property].type === 'number'" v-model="rule.operand" class="w-7rem text-right" /> -->
						<InputNumber
							v-if="Properties[rule.property].type === 'currency'"
							v-model="rule.operand"
							mode="currency"
							currency="USD"
							locale="en-US"
							class="w-7rem text-right"
						/>
						<InputText v-if="Properties[rule.property].type === 'string'" v-model="rule.operand" fluid />
					</template>
				</div>
				<div class="flex-grow-1" />
				<Button icon="pi pi-trash" text severity="secondary" @click="() => removeRule(rule, block)" />
			</div>
		</div>
		<div class="track-row">
			<div v-if="(block.AND || block.OR)?.length > 1" class="track end"></div>
			<div><Button text icon="pi pi-plus-circle" label="Add condition" @click="() => addRule({ property: '' }, block)" /></div>
		</div>
	</div>
</template>

<style scoped lang="scss">

.track-row {
	display: flex;
	align-items: stretch;

	> :not(.track) {
		padding: 5px 0;
	}

	.track {
		--width: 3.5rem;
		--left: calc((var(--width) / 2) - 5px);
		--color: var(--p-slate-300);
		--thickness: 2px;
		--middle: 24px;
		min-width: var(--width);
		max-width: var(--width);
		min-height: 100%;
		position: relative;

		&:not(.end)::before {
			content: '';
			position: absolute;
			left: var(--left);
			top: calc(var(--middle) - 10px);
			bottom: 0;
			border-left: var(--thickness) solid var(--color);
		}

		&:not(.start):after {
			content: '';
			position: absolute;
			left: var(--left);
			right: 0;
			top: 0;
			bottom: calc(100% - var(--middle));
			border-left: var(--thickness) solid var(--color);
			border-bottom: var(--thickness) solid var(--color);
			border-bottom-left-radius: 10px;
		}

		button {
			position: absolute;
			top: 5px;
			left: 0;
			right: 10px;
			z-index: 2;
			background-color: var(--color-background);
		}
	}

}
</style>
