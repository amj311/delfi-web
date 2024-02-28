<script setup lang="ts">
import { useBudgetStore } from '@/stores/budget.store';
import type { Budget } from 'models/types';
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
	scheduleJson: JSON.stringify(props.budget.schedule || { rrules: [ { start: '2021-04-01', frequency: 'MONTHLY', byDayOfMonth: [1] } ] }, null, 2),
});

const isNew = computed(() => {
	return !state.data.budget_id;
});

const finalize = async () => {
	try {
		state.isSaving = true;
		state.data.schedule = state.scheduleJson ? JSON.parse(state.scheduleJson) : undefined;
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
	if (!state.data.budget_id) return;
	try {
		state.isSaving = true;
		await budgetStore.deleteBudget(state.data.budget_id);
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

	<div><label for="name">Name</label><input id="name" v-model="state.data.name" /></div>
	<div>
		<label for="amount">Amount</label>
		<input id="amount" v-model="state.data.amount" type="number" min="0" />
	</div>

	<div>
		<label for="num_months">Months</label>
		<input id="num_months" v-model="state.data.num_months" type="number" min="1" />
	</div>

	<div>
		<label for="schedule">Schedule</label>
		<textarea id="schedule" v-model="state.scheduleJson" />
	</div>

	<div>
		<label for="system_event_account">Account for events</label>
		<select id="system_event_account" v-model="state.data.system_event_account_id">
			<option v-for="account in accountStore.accounts" :key="account.account_id" :value="account.account_id">{{account.display_name}}</option>
		</select>
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
