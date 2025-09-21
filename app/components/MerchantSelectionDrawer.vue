<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { type Merchant, type MerchantDraft } from 'delfi-core/models/Transaction';
import AttributionAvatar from './AttributionAvatar.vue';
import NavTriggerDrawer from './utils/NavTrigger/NavTriggerDrawer.vue';
import { useMerchantStore } from '@/stores/merchant.store';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import request from '@/services/request';
import { useToast } from 'primevue/usetoast';
import DrawerModal from './utils/DrawerModal.vue';
import { coalesce, jsonCopy } from 'delfi-core/utils/miscUtils';
import { CategoryKeys } from 'delfi-core/models/systemCategories';
import Select from 'primevue/select';

const toast = useToast();

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
	},
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

const filter = ref<string>('');
const merchants = computed(() =>
	useMerchantStore().merchants.filter((m) => {
		return !filter.value.trim() || m.name.toLowerCase().includes(filter.value.trim().toLowerCase());
	})
);

/*************
 * TRANSACTION SEARCH
 */

const transactionSearchMerchant = ref<Merchant | null>(null);
const searchingForTransactionMerchant = ref(false);
async function findForTransaction() {
	if (!transactionId.value) return;
	if (transactionSearchMerchant.value) {
		setMerchantFromTransactionSearch();
		return;
	}
	searchingForTransactionMerchant.value = true;
	try {
		const { data } = await request.get('/merchant/findTransactionMerchant/' + transactionId.value);
		transactionSearchMerchant.value = data.data;
		setMerchantFromTransactionSearch();
		if (!transactionSearchMerchant.value) {
			toast.add({
				severity: 'info',
				summary: 'No merchant found',
				detail: 'No merchant could be detected from the transaction details.',
				life: 3000,
			});
		}
	} catch (error) {
		toast.add({
			severity: 'error',
			summary: 'Error',
			detail: 'Failed to search for merchant on the web. Please try again later.',
			life: 3000,
		});
	} finally {
		searchingForTransactionMerchant.value = false;
	}
}

function setMerchantFromTransactionSearch() {
	if (!transactionSearchMerchant.value) return;
	if (transactionSearchMerchant.value.merchant_id) {
		selectedMerchantId.value = transactionSearchMerchant.value.merchant_id;
	} else {
		editingMerchant.value = jsonCopy(transactionSearchMerchant.value);
	}
}


/*************
 * EDITING MERCHANT
 */

const editingMerchantModal = ref<InstanceType<typeof DrawerModal> | null>(null);
const isSavingMerchant = ref(false);
const editingMerchant = ref<MerchantDraft | null>(null);

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
async function draftNewMerchant() {
	editingMerchant.value = {
		name: '',
		hostname: '',
		logo: '',
		detection_key: null,
	};
}
const isCreatingMerchant = computed(() => {
	return editingMerchant.value && !editingMerchant.value.merchant_id;
});
async function saveMerchant() {
	if (!editingMerchant.value) return;
	isSavingMerchant.value = true;
	try {
		if (editingMerchant.value.merchant_id) {
			await useMerchantStore().updateMerchant(editingMerchant.value as Merchant);
		} else {
			await useMerchantStore().createMerchant(editingMerchant.value);
		}
		editingMerchant.value = null; // Close the editor
	} catch (error) {
		console.error('Failed to save merchant:', error);
		toast.add({
			severity: 'error',
			summary: 'Error',
			detail: 'Failed to save merchant. Please try again later.',
			life: 3000,
		});
	} finally {
		isSavingMerchant.value = false;
	}
}




/*****************
 * DETAILS SEARCH
 * Searches for additional merchant details based on existing info
 */

 const canSearchDetails = computed(() => {
	return editingMerchant.value
		&& (editingMerchant.value.name.trim().length > 0 || coalesce(editingMerchant.value.hostname?.trim(), '').length > 0);
 });
 const searchingMerchantDetails = ref(false);
 async function searchMerchantDetails() {
	if (!editingMerchant.value || !canSearchDetails.value || searchingMerchantDetails.value) return;
	searchingMerchantDetails.value = true;
	try {
		const { data } = await request.get('/merchant/searchDetails', {
			params: {
				name: editingMerchant.value.name,
				hostname: coalesce(editingMerchant.value.hostname?.trim(), ''),
			},
		});
		editingMerchant.value = { ...editingMerchant.value, ...data.data };
	} catch (error) {
		toast.add({
			severity: 'error',
			summary: 'Error',
			detail: 'Failed to search for merchant details. Please try again later.',
			life: 3000,
		});
	} finally {
		searchingMerchantDetails.value = false;
	}
}

const categoryOptions = computed(() =>
	[{ value: undefined as any, label: 'None' }].concat(
		CategoryKeys.map((key) => ({
			value: key,
			label: key,
		}))
	)
);
</script>

<template>
	<NavTriggerDrawer
		ref="triggerRef"
		triggerKey="select-merchant"
		title="Select Merchant"
		@close="cancelSelection"
		:width="25"
	>
		<div class="flex flex-column h-full">
			<div
				class="flex align-items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 border-round"
				@click="() => selectMerchant(undefined)"
			>
				<AttributionAvatar :icon="'question-circle'" style="width: 2rem; height: 2rem" />
				<div class="flex-grow-1">No merchant</div>
				<i class="pi pi-check" v-if="!selectedMerchantId" />
			</div>
			<div
				v-if="selectedMerchant"
				class="flex align-items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 border-round"
				@click="() => selectMerchant(selectedMerchant)"
			>
				<AttributionAvatar :image="selectedMerchant.logo" style="width: 2rem; height: 2rem" />
				<div class="flex-grow-1">{{ selectedMerchant.name }}</div>
				<i class="pi pi-check" v-if="selectedMerchantId === selectedMerchant.merchant_id" />
			</div>

			<div>
				<Button
					v-if="transactionId && !selectedMerchantId"
					severity="secondary"
					@click="findForTransaction"
					class="my-2"
					:icon="searchingForTransactionMerchant ? 'pi pi-spinner pi-spin' : 'pi pi-sparkles'"
					:label="searchingForTransactionMerchant ? 'Searching...' : 'Detect merchant from transaction'"
					:disabled="searchingForTransactionMerchant"
				/>
				<br />
				<Button
					icon="pi pi-plus"
					label="Create new merchant..."
					severity="secondary"
					@click="draftNewMerchant"
				/>
			</div>

			<div class="searchbar">
				<InputText v-model="filter" placeholder="Search..." class="w-full" />
				<i class="pi pi-search"></i>
			</div>

			<div class="flex flex-column overflow-y-auto">
				<div
					v-for="merchant in merchants"
					:key="merchant.merchant_id"
					class="flex align-items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 border-round hover-show-trigger"
					@click="() => selectMerchant(merchant)"
				>
					<AttributionAvatar :image="merchant.logo" style="width: 2rem; height: 2rem" />
					<div class="text-ellipsis flex-grow-1 min-w-0">{{ merchant.name }}</div>
					<i class="pi pi-pencil hover-show" @click.stop="editMerchant(merchant)" />
					<i class="pi pi-check" v-if="selectedMerchantId === merchant.merchant_id" />
				</div>
			</div>
		</div>
	</NavTriggerDrawer>

	<DrawerModal ref="editingMerchantModal" :title="isCreatingMerchant ? 'New Merchant' : 'Edit Merchant'">
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
					<div class="flex align-items-center gap-2">
						<InputText v-model="editingMerchant.logo" placeholder="Merchant Logo URL" />
						<AttributionAvatar :image="editingMerchant.logo" :size="2" :key="editingMerchant.logo || ''" />
					</div>
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
			<div class="flex align-items-center gap-2">
				<Button
					:icon="searchingMerchantDetails ? 'pi pi-spinner pi-spin' : 'pi pi-globe'"
					:label="searchingMerchantDetails ? 'Searching...' : 'Search web'"
					:disabled="searchingMerchantDetails || !canSearchDetails"
					severity="secondary"
					@click="searchMerchantDetails"
				/>

				<div class="flex-grow-1" />

				<Button class="p-button-text" label="Cancel" @click="editingMerchant = null" />
				<Button label="Save" :loading="isSavingMerchant" :disabled="isSavingMerchant" @click="saveMerchant" />
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
