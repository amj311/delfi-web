<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { type Merchant } from 'delfi-core/models/Transaction';
import AttributionAvatar from './AttributionAvatar.vue';
import NavTriggerDrawer from './utils/NavTrigger/NavTriggerDrawer.vue';
import { useMerchantStore } from '@/stores/merchant.store';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import request from '@/services/request';
import { useToast } from 'primevue/usetoast';
import DrawerModal from './utils/DrawerModal.vue';
import { jsonCopy } from 'delfi-core/utils/miscUtils';
import { CategoryKeys } from 'delfi-core/models/systemCategories';
import Select from 'primevue/select';

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
	webSearchedMerchant.value = null; // Reset web searched merchant when selecting a merchant
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

const isSavingWebMerchant = ref(false);
async function selectWebMerchant() {
	if (!webSearchedMerchant.value) return;
	if (isSavingWebMerchant.value) return; // Prevent multiple clicks

	let newMerchant;
	isSavingWebMerchant.value = true;
	try {
		if (webSearchedMerchant.value.merchant_id) {
			newMerchant = webSearchedMerchant.value;
		}
		else {
			newMerchant = await useMerchantStore().createMerchant(webSearchedMerchant.value);
		}
		selectMerchant(newMerchant);
	} catch (error) {
		console.error('Failed to create merchant from web search:', error);
		// useToast().add({
		// 	severity: 'error',
		// 	summary: 'Error',
		// 	detail: 'Failed to create merchant from web search. Please try again later.'
		// });
		return;
	} finally {
		isSavingWebMerchant.value = false;
	}
}

const editingMerchantModal = ref<InstanceType<typeof DrawerModal> | null>(null);
const isSavingMerchant = ref(false);
const editingMerchant = ref<Merchant | null>(null);

watch(editingMerchant, (newVal) => {
	if (newVal) {
		editingMerchantModal.value?.open();
	} else {
		editingMerchantModal.value?.close();
	}
});

async function editMerchant(merchant: Merchant) {
	editingMerchant.value = jsonCopy(merchant);
}
async function saveMerchant() {
	if (!editingMerchant.value) return;
	isSavingMerchant.value = true;
	try {
		await useMerchantStore().updateMerchant(editingMerchant.value);
		editingMerchant.value = null; // Close the editor
	} catch (error) {
		console.error('Failed to save merchant:', error);
		// useToast().add({
		// 	severity: 'error',
		// 	summary: 'Error',
		// 	detail: 'Failed to save merchant. Please try again later.'
		// });
	} finally {
		isSavingMerchant.value = false;
	}
}

const categoryOptions = computed(() => [{ value: undefined as any, label: 'None' }].concat(CategoryKeys.map(key => ({
	value: key,
	label: key,
}))));

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
						@click="selectWebMerchant"
					>
						<AttributionAvatar
							:image="webSearchedMerchant.logo"
							style="width: 2rem; height: 2rem;"
						/>
						<div class="flex-grow-1">{{ webSearchedMerchant.name }}</div>
						<i v-if="isSavingWebMerchant" class="pi pi-spin pi-spinner" />
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
					class="flex align-items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 border-round hover-show-trigger"
					@click="() => selectMerchant(merchant)"
				>
					<AttributionAvatar
						:image="merchant.logo"
						style="width: 2rem; height: 2rem;"
					/>
					<div class="text-ellipsis flex-grow-1 min-w-0">{{  merchant.name }}</div>
					<i class="pi pi-pencil hover-show" @click.stop="editMerchant(merchant)" />
					<i class="pi pi-check" v-if="selectedMerchantId === merchant.merchant_id" />
				</div>
			</div>
		</div>
	</NavTriggerDrawer>

	<DrawerModal
		ref="editingMerchantModal"
		:title="`Edit Merchant`"
	>
		<template #default v-if="editingMerchant">
			<div class="flex flex-column gap-2 details-rows">
				<div class="row">
					<label>Name</label>
					<InputText v-model="editingMerchant.name" placeholder="Merchant Name" />
				</div>
				<div class="row">
					<label>Hostname</label>
					<InputText v-model="editingMerchant.hostname" placeholder="Merchant Hostname" />
				</div>
				<div class="row">
					<label>Logo URL</label>
					<InputText v-model="editingMerchant.logo" placeholder="Merchant Logo URL" />
				</div>
				<div class="row">
					<label>Category Key</label>
					<Select
						v-model="editingMerchant.detection_key"
						:options="categoryOptions"
						placeholder="Select a category"
						optionLabel="label"
						optionValue="value"
						filter
					/>
				</div>
			</div>
			<br />
			<div class="flex justify-content-end gap-2">
				<Button
					class="p-button-text"
					label="Cancel"
					@click="editingMerchant = null"
				/>
				<Button
					label="Save"
					:loading="isSavingMerchant"
					:disabled="isSavingMerchant"
					@click="saveMerchant"
				/>
			</div>
		</template>
	</DrawerModal>
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
