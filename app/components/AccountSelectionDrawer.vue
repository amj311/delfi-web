<script setup lang="ts">
import { computed, ref } from 'vue';
import NavTriggerDrawer from './utils/NavTrigger/NavTriggerDrawer.vue';
import { useAccountStore } from '@/stores/account.store';
import type { Account } from 'delfi-core/models/Account';
import AccountSelector from './AccountSelector.vue';

const triggerRef = ref<InstanceType<typeof NavTriggerDrawer> | null>(null);
let resolvePromise: ((account: string | null) => void) | null = null;
const selectedAccountId = ref<string>('');

defineExpose({
	selectAccount: (currentAccountId?: string | null) => {
		return new Promise<string | null>((resolve) => {
			resolvePromise = resolve;
			selectedAccountId.value = currentAccountId || '';
			triggerRef.value?.trigger()?.open();
		});
	}
});

function selectAccountId(account_id: string | null) {
	selectedAccountId.value = account_id || '';
	if (resolvePromise) {
		resolvePromise(account_id || null);
		resolvePromise = null;
	}
	triggerRef.value?.trigger()?.close();
}

function cancelSelection() {
	if (resolvePromise) {
		resolvePromise(selectedAccountId.value || null);
		resolvePromise = null;
	}
}

</script>

<template>
	<NavTriggerDrawer ref="triggerRef" triggerKey="select-account" title="Select Account" @close="cancelSelection" :width="25">
		<AccountSelector
			:currentAccountId="selectedAccountId || null"
			@select="selectAccountId"
		/>
	</NavTriggerDrawer>
</template>

<style scoped lang="scss">
</style>