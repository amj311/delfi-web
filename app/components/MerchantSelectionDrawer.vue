<script setup lang="ts">
import { computed, ref } from 'vue';
import { type Merchant } from 'delfi-core/models/Transaction';
import AttributionAvatar from './AttributionAvatar.vue';
import NavTriggerDrawer from './utils/NavTrigger/NavTriggerDrawer.vue';
import { useMerchantStore } from '@/stores/merchant.store';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import request from '@/services/request';
import { useToast } from 'primevue/usetoast';

const triggerRef = ref<InstanceType<typeof NavTriggerDrawer> | null>(null);
let resolvePromise: ((merchant: Merchant | null) => void) | null = null;
const selectedMerchantId = ref<string>('');
const selectedMerchant = computed(() => {
	return useMerchantStore().getMerchantById(selectedMerchantId.value);
});
const transactionId = ref<string | null>(null);

defineExpose({
	selectMerchant: (currentMerchantId?: string | null, currentTransactionId?: string) => {
		return new Promise<Merchant | null>((resolve) => {
			resolvePromise = resolve;
			selectedMerchantId.value = currentMerchantId || '';
			transactionId.value = currentTransactionId || null;
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


const webSearchedMerchant = ref<Merchant | null>(null);
const isSearchingForWebMerchant = ref(false);
async function searchMerchant() {
	if (!transactionId.value) return;
	isSearchingForWebMerchant.value = true;
	try {
		const { data } = await request.get('/merchant/findTransactionMerchant/' + transactionId.value);
		webSearchedMerchant.value = data.data;
	} catch (error) {
		useToast().add({
			severity: 'error',
			summary: 'Error',
			detail: 'Failed to search for merchant on the web. Please try again later.'
		});
	} finally {
		isSearchingForWebMerchant.value = false;
	}
}

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

			<div v-if="transactionId">
				<Button v-if="!webSearchedMerchant"
					icon="pi pi-plus"
					:label="isSearchingForWebMerchant ? 'Searching...' : 'Search web for merchant'"
					:disabled="isSearchingForWebMerchant"
					severity="secondary"
					class="mt-2 mb-2"
					@click="searchMerchant"
				/>

				<div v-else>
					<div class="flex align-items-center gap-3">
						Web result:
						<div class="flex-grow-1" />
						<Button
							size="small"
							icon="pi pi-times"
							severity="secondary"
							class="p-button-rounded p-button-text"
							@click="webSearchedMerchant = null"
						/>
					</div>
					<div
						class="flex align-items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 border-round"
						@click="() => selectMerchant(webSearchedMerchant!)"
					>
						<AttributionAvatar
							:image="webSearchedMerchant.logo"
							style="width: 2rem; height: 2rem;"
						/>
						<div class="flex-grow-1">{{ webSearchedMerchant.name }}</div>
					</div>
				</div>
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
