<script setup lang="ts">
import { computed, ref } from 'vue';
import { type Merchant } from 'delfi-core/models/Transaction';
import AttributionAvatar from './AttributionAvatar.vue';
import NavTriggerDrawer from './utils/NavTrigger/NavTriggerDrawer.vue';
import { useMerchantStore } from '@/stores/merchant.store';
import InputText from 'primevue/inputtext';

const triggerRef = ref<InstanceType<typeof NavTriggerDrawer> | null>(null);
let resolvePromise: ((merchant: Merchant | null) => void) | null = null;
const selectedMerchantId = ref<string>('');
const selectedMerchant = computed(() => {
	return useMerchantStore().getMerchantById(selectedMerchantId.value);
});

defineExpose({
	selectMerchant: (currentMerchantId?: string | null) => {
		return new Promise<Merchant | null>((resolve) => {
			resolvePromise = resolve;
			selectedMerchantId.value = currentMerchantId || '';
			triggerRef.value?.trigger()?.open();
		});
	}
});

function selectMerchant(merchant?: Merchant) {
	selectedMerchantId.value = merchant?.merchant_id || '';
	if (resolvePromise) {
		resolvePromise(merchant || null);
		resolvePromise = null;
	}
	triggerRef.value?.trigger()?.close();
}

function cancelSelection() {
	if (resolvePromise) {
		resolvePromise(selectedMerchant.value || null);
		resolvePromise = null;
	}
}

const search = ref<string>('');
const merchants = computed(() => useMerchantStore().merchants.filter(m => {
	return !search.value.trim() || m.name.toLowerCase().includes(search.value.trim().toLowerCase());
}));

</script>

<template>
	<NavTriggerDrawer ref="triggerRef" triggerKey="select-merchant" title="Select Merchant" @close="cancelSelection" :width="25">
		<div class="flex flex-column h-full">
			<div
				class="flex align-items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 border-round"
				@click="() => selectMerchant(undefined)"
			>
				<AttributionAvatar
					:icon="'question-circle'"
					style="width: 2rem; height: 2rem;"
				/>
				<div class="flex-grow-1">No merchant</div>
				<i class="pi pi-check" v-if="!selectedMerchantId" />
			</div>
			<div
				v-if="selectedMerchant"
				class="flex align-items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 border-round"
				@click="() => selectMerchant(selectedMerchant)"
			>
				<AttributionAvatar
					:image="selectedMerchant.logo"
					style="width: 2rem; height: 2rem;"
				/>
				<div class="flex-grow-1">{{  selectedMerchant.name }}</div>
				<i class="pi pi-check" v-if="selectedMerchantId === selectedMerchant.merchant_id" />
			</div>

			<div class="searchbar">
				<InputText
					v-model="search"
					placeholder="Search..."
					class="w-full"
				/>
				<i class="pi pi-search"></i>
			</div>

			<div class="flex flex-column overflow-y-auto">
				<div
					v-for="merchant in merchants"
					:key="merchant.merchant_id"
					class="flex align-items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 border-round"
					@click="() => selectMerchant(merchant)"
				>
					<AttributionAvatar
						:image="merchant.logo"
						style="width: 2rem; height: 2rem;"
					/>
					<div class="flex-grow-1">{{  merchant.name }}</div>
					<i class="pi pi-check" v-if="selectedMerchantId === merchant.merchant_id" />
				</div>
			</div>
		</div>
	</NavTriggerDrawer>
</template>

<style scoped lang="scss">
.searchbar {
	position: relative;
	padding: 0.5rem 0;
	background: var(--color-background);

	> i.pi {
		position: absolute;
		right: 0.7rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--p-text-color);
	}
}
</style>
