<script setup lang="ts">
import { computed } from 'vue';
import Button from 'primevue/button';
import Snackbar from '@/components/utils/Snackbar.vue';
import Icon from '@/components/Icon.vue';
import TransactionAttributionDrawer from '@/components/TransactionAttributionDrawer.vue';
import { useTransactionSelectionStore } from '@/stores/transaction-selection.store';

const store = useTransactionSelectionStore();
const numSelected = computed(() => store.numSelected);
</script>

<template>
	<Snackbar :visible="numSelected > 0" closeable @close="() => store.clear()">
		<Icon name="material-symbols::check_circle" />
		{{ numSelected }}
		<div class="flex-grow-1" />
		<Button icon="pi pi-pencil" @click="store.editSelectionAttributions" />
	</Snackbar>
	<TransactionAttributionDrawer :ref="(el: any) => (store.transactionAttributionDrawer = el)" />
</template>
