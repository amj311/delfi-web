<script setup lang="ts">
import { useBudgetStore } from '@/stores/budget.store';
import { BudgetDisplayShape, RecurrenceType, type Budget } from '../../delfi-core/models/Budget';
import { computed, reactive, toRefs } from 'vue';
import { useAccountStore } from '@/stores/account.store';
import { useDelfiStore } from '@/stores/delfi.store';

const budgetStore = useBudgetStore();
const accountStore = useAccountStore();
const delfiStore = useDelfiStore();

const _props = defineProps<{
	budget: Partial<Budget>,
	close: () => void,
	onSave?: (data: { budget: Budget | null, isNew: boolean }) => void,
}>();
const props = reactive(_props);

const state = reactive({
	isSaving: false,
	data: <Partial<Budget>>JSON.parse(JSON.stringify(props.budget)), // deep copy
	scheduleJson: JSON.stringify(props.budget.schedule || { rrules: [ { start: '2022-06-17', frequency: 'MONTHLY', byDayOfMonth: [17] } ] }, null, 2),
	triggerJson: JSON.stringify(props.budget.trigger || undefined, null, 2),
});

const isNew = computed(() => {
	return !state.data.planned_transaction_id;
});

const finalize = async () => {
	try {
		state.isSaving = true;
		state.data.schedule = state.scheduleJson ? JSON.parse(state.scheduleJson) : undefined;
		state.data.trigger = state.triggerJson ? JSON.parse(state.triggerJson) : undefined;
		let budget = await budgetStore.upsertBudget(state.data);
		props.onSave && props.onSave({ budget, isNew: isNew.value });
		props.close();
	}
	catch (e) {
		console.error(e);
	}
	finally {
		state.isSaving = false;
	}
}
const deleteBudget = async () => {
	if (!state.data.planned_transaction_id) return;
	try {
		state.isSaving = true;
		await budgetStore.deleteBudget(state.data.planned_transaction_id);
		props.onSave && props.onSave({ budget: null, isNew: isNew.value });
		props.close();
	}
	catch (e) {
		console.error(e);
	}
	finally {
		state.isSaving = false;
	}
}
</script>

<template>
	<div>{{ isNew ? 'New' : 'Edit' }} Budget</div>

	<div><label for="memo">Memo</label><input id="memo" v-model="state.data.memo" /></div>
	<div><label for="type">Type</label>
		<select id="type" v-model="state.data.type">
			<option v-for="ptype in BudgetDisplayShape" :key="ptype">{{ptype}}</option>
		</select>
	</div>
	<div><label for="target_account">{{ state.data.type === BudgetDisplayShape.TRANSFER ? 'From ' : '' }}Account</label>
		<select id="type" v-model="state.data.account_id">
			<option v-for="account in accountStore.accounts" :key="account.account_id" :value="account.account_id">{{account.display_name}}</option>
		</select>
	</div>

	<div v-if="state.data.type === BudgetDisplayShape.TRANSFER">
		<label for="origin_account">To Account</label>
		<select id="origin_account" v-model="state.data.origin_account_id">
			<option v-for="account in accountStore.accounts" :key="account.account_id" :value="account.account_id">{{account.display_name}}</option>
		</select>
	</div>

	<div><label for="recurrence_type">Recurrence Type</label>
		<select id="recurrence_type" v-model="state.data.recurrence_type">
			<option v-for="ptype in RecurrenceType" :key="ptype">{{ptype}}</option>
		</select>
	</div>
	
	<div v-if="state.data.recurrence_type === RecurrenceType.SCHEDULE">
		<label for="amount">Amount</label>
		<input id="amount" v-model="state.data.amount" type="number" min="0" />
	</div>
	
	<div v-if="state.data.recurrence_type === RecurrenceType.SCHEDULE">
		<label for="schedule">Schedule</label>
		<textarea id="schedule" v-model="state.scheduleJson" />
	</div>
	
	<div v-if="state.data.recurrence_type === RecurrenceType.TRIGGER"><label for="trigger">Trigger</label>
		<textarea id="trigger" v-model="state.triggerJson" />
	</div>

	<div><label for="category_id">Category</label>
		<select id="category_id" v-model="state.data.category_id">
			<template v-for="category in delfiStore.delfi?.composedCategories" :key="category.category_id">
				<option value="category.category_id">{{category.name}}</option>
				<option v-for="child in category.children" :key="child.category_id" :value="child.category_id">&nbsp;&nbsp;{{child.name}}</option>
			</template>
		</select>
	</div>
	
	

	<div>
		<button @click="close">Cancel</button>
		<button v-if="!isNew" :disabled="state.isSaving" @click="deleteBudget">Delete</button>
		<button @click="finalize" :disabled="state.isSaving">Save</button>
	</div>
</template>

<style scoped></style>
