<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import NavTriggerDrawer from './utils/NavTrigger/NavTriggerDrawer.vue';
import { useAccountStore } from '@/stores/account.store';
import type { Account } from 'delfi-core/models/Account';
import AccountSelector from './AccountSelector.vue';
import { useAppStore } from '@/stores/app.store.js';
import Button from 'primevue/button';
import Icon from './Icon.vue';
import { AuthService } from '@/services/authService.js';
import SettingsDrawerModal from './SettingsDrawerModal.vue';
import { wait } from 'delfi-core/utils/miscUtils.js';

const triggerRef = ref<InstanceType<typeof NavTriggerDrawer> | null>(null);
let resolvePromise: ((account: string | null) => void) | null = null;
const selectedAccountId = ref<string>('');

watch(() => useAppStore().navDrawerOpen, (open) => {
	if (open) {
		triggerRef.value?.trigger()?.open();
	}
})

async function close() {
	useAppStore().navDrawerOpen = false;
	await triggerRef.value?.trigger()?.close();
}

async function signOut() {
	await AuthService.signOut();
	close();
}

const settingsDrawer = ref<InstanceType<typeof SettingsDrawerModal>>();
async function openSettings() {
	await close();
	await settingsDrawer.value?.open();
}
</script>

<template>
	<NavTriggerDrawer
		ref="triggerRef"
		triggerKey="app-nav"
		@close="close" 
		:width="25"
		position="left"
		:fullMobile="false"
	>
		<div class="fex-column align-items-stretch justify-content-stretch h-full">
			<Button text size="large" class="w-full justify-content-start" label="Settings" icon="pi pi-cog" @click="openSettings"></Button>
			<div class="flex-grow-1" />
			<Button text size="large" class="w-full justify-content-start" label="Sign out" @click="signOut"><template #icon><Icon name="material-symbols::logout" /></template></Button>
		</div>
	</NavTriggerDrawer>

	<SettingsDrawerModal ref="settingsDrawer" />
</template>

<style scoped lang="scss">
</style>