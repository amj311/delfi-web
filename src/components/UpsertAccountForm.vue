<script setup lang="ts">
import { useAccountStore } from '@/stores/account.store';
import type { Account } from 'models/types';
import { computed, reactive, toRefs } from 'vue';

const accountStore = useAccountStore();

const _props = defineProps<{
	account: Account | {},
	close: () => void,
	onSave?: (data: { account: Account, isNew: boolean }) => void,
}>();
const props = reactive(_props);

const state = {
	isSaving: false,
	data: <Partial<Account>>JSON.parse(JSON.stringify(props.account)), // deep copy
}

const isManual = computed(() => {
	return !state.data.external_account_id;
});
const isNew = computed(() => {
	return !state.data.account_id;
});

const finalize = async () => {
	try {
		state.isSaving = true;
		let account;
		if (isNew.value) {
			account = await accountStore.createAccount(state.data);
		}
		else {
			account = await accountStore.updateAccount(state.data);
		}
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
</script>

<template>
  <div>{{ isNew ? 'New' : 'Edit' }} {{ isManual ? 'Manual' : 'Linked' }} Account</div>
  <small>{{state.data.external_name}}</small>
  <small>{{state.data.mask}}</small>

  <div><label for="custom_name">Custom Name</label><input id="custom_name" v-model="state.data.custom_name" /></div>
  <div><label for="current_balance">Balance</label><input id="current_balance" v-model="state.data.current_balance" type="number" /></div>
  <div><label for="type">type</label><input id="type" v-model="state.data.type" type="number" /></div>
  <div><label for="subtype">subtype</label><input id="subtype" v-model="state.data.subtype" type="number" /></div>
  <div><label for="subtype">iso_currency_code</label><input id="iso_currency_code" v-model="state.data.iso_currency_code" type="number" /></div>
  <div><button @click="finalize">Save</button></div>
</template>

<style scoped>
</style>
