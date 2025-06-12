<script setup lang="ts">
import { usePlannedTransactionStore } from '@/stores/plannedTransaction.store';
import { BudgetType, RecurrenceType } from '../../delfi-core/models/Budget';
import type { PlannedTransaction } from 'models/types';
import { computed, reactive, toRefs } from 'vue';
import { useAccountStore } from '@/stores/account.store';
import { useDelfiStore } from '@/stores/delfi.store';

const plannedTransactionStore = usePlannedTransactionStore();
const accountStore = useAccountStore();
const delfiStore = useDelfiStore();

const _props = defineProps<{
	plannedTransaction: Partial<PlannedTransaction>,
	close: () => void,
	onSave?: (data: { plannedTransaction: PlannedTransaction | null, isNew: boolean }) => void,
}>();
const props = reactive(_props);

const state = reactive({
	isSaving: false,
	data: <Partial<PlannedTransaction>>JSON.parse(JSON.stringify(props.plannedTransaction)), // deep copy
	scheduleJson: JSON.stringify(props.plannedTransaction.schedule || { rrules: [ { start: '2022-06-17', frequency: 'MONTHLY', byDayOfMonth: [17] } ] }, null, 2),
	triggerJson: JSON.stringify(props.plannedTransaction.trigger || undefined, null, 2),
});

const isNew = computed(() => {
	return !state.data.planned_transaction_id;
});

const finalize = async () => {
	try {
		state.isSaving = true;
		state.data.schedule = state.scheduleJson ? JSON.parse(state.scheduleJson) : undefined;
		state.data.trigger = state.triggerJson ? JSON.parse(state.triggerJson) : undefined;
		let plannedTransaction = await plannedTransactionStore.upsertPlannedTransaction(state.data);
		props.onSave && props.onSave({ plannedTransaction, isNew: isNew.value });
		props.close();
	}
	catch (e) {
		console.error(e);
	}
	finally {
		state.isSaving = false;
	}
}
const deletePlannedTransaction = async () => {
	if (!state.data.planned_transaction_id) return;
	try {
		state.isSaving = true;
		await plannedTransactionStore.deletePlannedTransaction(state.data.planned_transaction_id);
		props.onSave && props.onSave({ plannedTransaction: null, isNew: isNew.value });
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
	<div>{{ isNew ? 'New' : 'Edit' }} PlannedTransaction</div>

	<div><label for="memo">Memo</label><input id="memo" v-model="state.data.memo" /></div>
	<div><label for="type">Type</label>
		<select id="type" v-model="state.data.type">
			<option v-for="ptype in BudgetType" :key="ptype">{{ptype}}</option>
		</select>
	</div>
	<div><label for="target_account">{{ state.data.type === BudgetType.TRANSFER ? 'From ' : '' }}Account</label>
		<select id="type" v-model="state.data.target_account_id">
			<option v-for="account in accountStore.accounts" :key="account.account_id" :value="account.account_id">{{account.display_name}}</option>
		</select>
	</div>

	<div v-if="state.data.type === BudgetType.TRANSFER">
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
		<button v-if="!isNew" :disabled="state.isSaving" @click="deletePlannedTransaction">Delete</button>
		<button @click="finalize" :disabled="state.isSaving">Save</button>
	</div>
</template>

<style scoped></style>
