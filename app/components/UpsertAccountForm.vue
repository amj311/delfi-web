<script setup lang="ts">
import { useAccountStore } from '@/stores/account.store';
import { computed, reactive, toRefs } from 'vue';
import type { Account } from 'delfi-core/models/Account';

const accountStore = useAccountStore();

const _props = defineProps<{
	account: Account | {},
	close: () => void,
	onSave?: (data: { account: Account | null, isNew: boolean }) => void,
}>();
const props = reactive(_props);

const state = reactive({
	isSaving: false,
	data: <Partial<Account>>JSON.parse(JSON.stringify(props.account)), // deep copy
})

const isManual = computed(() => {
	return !state.data.external_account_id;
});
const isNew = computed(() => {
	return !state.data.account_id;
});

const finalize = async () => {
	try {
		state.isSaving = true;
		let account = await accountStore.upsertAccount(state.data);
		props.onSave && props.onSave({account, isNew: isNew.value});
		props.close();
	}
	catch (e) {
		console.error(e);
	}
	finally {
		state.isSaving = false;
	}
}
const deleteAccount = async () => {
	if (!state.data.account_id) return;
	try {
		state.isSaving = true;
		await accountStore.deleteAccount(state.data.account_id);
		props.onSave && props.onSave({account: null, isNew: isNew.value});
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
  <div>{{ isNew ? 'New' : 'Edit' }} {{ isManual ? 'Manual' : 'Linked' }} Account</div>
  <small>{{state.data.external_name}}</small>
  <small>{{state.data.mask}}</small>

  <div><label for="display_name">Account Name</label><input id="display_name" v-model="state.data.display_name" /></div>
  <div><label for="current_balance">Balance</label><input id="current_balance" v-model="state.data.current_balance" type="number" /></div>
  <div><label for="type">type</label><input id="type" v-model="state.data.type" /></div>
  <div><label for="subtype">subtype</label><input id="subtype" v-model="state.data.subtype" /></div>
  <div><label for="subtype">iso_currency_code</label><input id="iso_currency_code" v-model="state.data.iso_currency_code" /></div>
  <div>
	<button @click="close">Cancel</button>
	<button  v-if="!isNew" :disabled="state.isSaving" @click="deleteAccount">Delete</button>
	<button @click="finalize" :disabled="state.isSaving">Save</button></div>
</template>

<style scoped>
</style>
