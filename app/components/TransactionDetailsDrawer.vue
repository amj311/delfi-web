<script setup lang="ts">
import { computed, defineComponent, ref, watch } from 'vue';
import { TransactionUtils, type Transaction } from 'delfi-core/models/Transaction';
import Currency from './Currency.vue';
import { useAccountStore } from '@/stores/account.store';
import Button from 'primevue/button';
import Icon from './Icon.vue';
import { TransactionService } from '@/services/transaction.service';
import { useDelfiStore } from '@/stores/delfi.store';
import TransactionAttributionDrawer, { type Step } from './TransactionAttributionDrawer.vue';
import { usePrompt } from './utils/PromptModal.vue';
import { diff, jsonCopy } from 'delfi-core/utils/miscUtils';
import AttributionAvatar from './AttributionAvatar.vue';
import Textarea from 'primevue/textarea';
import debounce from '@/utils/debounce';
import NavTriggerDrawer from './utils/NavTrigger/NavTriggerDrawer.vue';
import DrawerModal from './utils/DrawerModal.vue';
import { useCategoryStore } from '@/stores/category.store';
import InputNumber from 'primevue/inputnumber';
import { useToast } from 'primevue/usetoast';
import { v4 as uuid } from 'uuid';
import MerchantSelectionDrawer from './MerchantSelectionDrawer.vue';

const triggerRef = ref<InstanceType<typeof NavTriggerDrawer> | null>(null);
const transaction = ref<Transaction>({} as Transaction);

defineExpose({
	open: (_transaction: Transaction) => {
		transaction.value = _transaction;
		notesDraft.value = transaction.value.notes;
		triggerRef.value?.trigger()?.open();
	},
});

const transactionAttributionDrawer = ref<InstanceType<typeof TransactionAttributionDrawer> | null>(null);

const showMoreFields = ref(false);
const saving = ref(false);
const lastSaved = ref<Date | null>(null);
const computeExclusions = ['notes'];

watch(
	() => jsonCopy(transaction.value),
	async (newTransaction, oldValue) => {
		// abort when changing transaction
		if (newTransaction.transaction_id !== oldValue.transaction_id) {
			return;
		}
		
		saving.value = true;
		try {
			await TransactionService.updateTransaction(transaction.value.transaction_id, newTransaction);
			lastSaved.value = new Date();
			const diffKeys = Object.keys(diff(oldValue, newTransaction) || {});
			console.log('Transaction saved:', transaction.value.transaction_id, 'Changes:', diff(oldValue, newTransaction));
			const shouldCompute = diffKeys.reduce((acc, key) => {
				return acc || !computeExclusions.includes(key);
			}, false);
			if (shouldCompute) {
				useDelfiStore().reCompute();
			}
		} catch (error) {
			console.error('Error saving transaction:', error);
		} finally {
			saving.value = false;
		}
	}
);

const isSplit = computed(() => {
	return transaction.value.Attributions.length > 1;
});

const largestAttribution = computed(() => {
	return transaction.value.Attributions.reduce((prev, curr) => {
		return curr.amount > prev.amount ? curr : prev;
	}, transaction.value.Attributions[0]);
});

const avatarDetails = computed(() => {
	return {
		Merchant: transaction.value.Merchant,
		Category: largestAttribution.value.Category,
	};
});

const account = computed(() => {
	return useAccountStore().getAccountById(transaction.value.account_id);
});

async function doAttributionDrawer(
	step: Step,
	attribution: Transaction['Attributions'][number]
) {
	if (transactionAttributionDrawer.value) {
		const selection = await transactionAttributionDrawer.value.waitForSelection(jsonCopy(attribution), step);
		if (!selection) {
			// rejected or closed
			return;
		}
		attribution.budget_id = selection.budget_id;
		attribution.Budget = selection.Budget;
		attribution.budget_child_item_id = selection.budget_child_item_id;
		attribution.BudgetChildItem = selection.BudgetChildItem;
		attribution.category_id = selection.category_id || null;
		attribution.Category = selection.Category;
		attribution.group_id = selection.group_id || undefined;
		attribution.Group = selection.Group;
	}
}

async function promptForMemo(attribution: Transaction['Attributions'][number]) {
	const result = await usePrompt().prompt({
		title: 'Edit Memo',
		message: 'Enter a memo for this transaction:',
		fields: [
			{
				key: 'memo',
				label: 'Memo',
				value: attribution.memo || '',
				placeholder: 'Enter memo...',
			},
		],
	});
	if (result?.confirmed) {
		attribution.memo = result.values.memo.trim();
	}
}

const merchantSelectionDrawer = ref<InstanceType<typeof MerchantSelectionDrawer> | null>(null);
async function selectMerchant() {
	if (merchantSelectionDrawer.value) {
		const selection = await merchantSelectionDrawer.value.selectMerchant(transaction.value.Merchant?.merchant_id || null, transaction.value.transaction_id);
		transaction.value.Merchant = selection || null;
		transaction.value.merchant_id = selection?.merchant_id || null;
	}
}

const notesDraft = ref<string | null | undefined>(transaction.value.notes);
const debounceNotesSave = debounce(() => {
	transaction.value.notes = notesDraft.value;
}, 1000);
watch(
	notesDraft,
	(newNotes) => {
		if (newNotes !== transaction.value.notes) {
			debounceNotesSave();
		}
	},
	{ immediate: true }
);

const splitModal = ref<InstanceType<typeof DrawerModal> | null>(null);
const draftAttributions = ref<Transaction['Attributions']>([]);
const splitTotalDiff = computed(() => {
	return draftAttributions.value.reduce((total, attr) => total + (attr.amount || 0), 0) - Math.abs(transaction.value.amount);
});
const splitsAreFull = computed(() => {
	return splitTotalDiff.value === 0;
});

// When one of the split amounts changes, modify the others if needed to make sure they do not exceed the total transaction amount
function handleSplitAmountChange(value: number, attribution: Transaction['Attributions'][number]) {
	// If total would be LARGER than transaction amount, remove some from another attribution
	if (splitTotalDiff.value > 0) {
		const excess = splitTotalDiff.value;
		for (const attr of draftAttributions.value) {
			if (attr !== attribution && attr.amount > 0) {
				const reduction = Math.min(excess, attr.amount);
				attr.amount -= reduction;
				break;
			}
		}
	}
}

function createNewSplit() {
	draftAttributions.value.push({
		amount: 0,
		memo: '',
		budget_id: null,
		category_id: null,
		group_id: undefined,
		transaction_attribution_id: uuid(),
		transaction_id: transaction.value.transaction_id
	})
}

function openSplitModal() {
	draftAttributions.value = jsonCopy(transaction.value.Attributions.sort((a, b) => b.amount - a.amount)).map((attr) => ({
		...attr,
		amount: Math.abs(attr.amount), // User always sees amounts as absolute value!
	}));
	if (draftAttributions.value.length === 1) {
		createNewSplit(); // Ensure at least one split exists
	}
	if (splitModal.value) {
		splitModal.value.open();
	}
}
async function saveSplitChanges() {
	if (!splitsAreFull.value) {
		return useToast().add({
			severity: 'error',
			summary: 'Error',
			detail: 'Splits must sum to the total transaction amount.',
		});
	}

	// Confirm removal of empty splits
	const emptySplits = draftAttributions.value.filter((attr) => attr.amount <= 0);
	if (emptySplits.length > 0) {
			const confirmed = await usePrompt().confirm({
				title: 'Remove Empty Splits',
				message: `Some splits are empty and will be removed. Do you want to continue?`,
			});
		if (!confirmed) {
			return;
		}
	}

	// Restore sign of amounts to match original transaction
	transaction.value.Attributions = draftAttributions.value.sort((a, b) => b.amount - a.amount).map((attr) => ({
		...attr,
		amount: Math.sign(transaction.value.amount) * attr.amount, // Store as absolute value
	})).filter((attr) => attr.amount !== 0); // Remove empty splits
	closeSplitModal();
}
function cancelSplitChanges() {
	draftAttributions.value = [];
	closeSplitModal();
}
function closeSplitModal() {
	if (splitModal.value) {
		splitModal.value.close();
	}
}
</script>

<template>
	<NavTriggerDrawer ref="triggerRef" :triggerKey="'transaction-details'">
		<div class="flex flex-column h-full">
			<div class="flex align-items-center gap-3">
				<div><AttributionAvatar :event="avatarDetails" :size="3" /></div>
				<div class="flex-frow-1 min-w-0">
					<h3 class="m-0 text-ellipsis w-full min-w-0">
						{{
							transaction.Merchant?.name ||
							TransactionUtils.getSimplifiedIdentifier(transaction.original_description)
								?.identifier ||
							transaction.original_description
						}}
					</h3>
					<div>{{ transaction.date.formatFull() }}</div>
				</div>
			</div>
			<div class="text-4xl my-4"><Currency :amount="transaction.amount" mode="transaction" /></div>

			<div
				style="font-family: monospace; opacity: 0.8; line-height: 1.2; font-size: 0.9em; word-break: break-all"
			>
				{{ transaction.original_description }}
			</div>
			<div class="flex align-items-center gap-2 my-2">
				<div
					class="border-round-sm square w-1rem"
					:style="{ backgroundImage: `url(${account?.Institution.logo})`, backgroundSize: 'cover' }"
				></div>
				<span>{{ account?.display_name || account?.external_name }} - {{ account?.Institution.name }}</span>
			</div>

			<br />

			<div v-for="attribution, i in transaction.Attributions" :key="attribution.transaction_attribution_id">
				<h4 v-if="isSplit" class="flex align-items-center gap-2 mt-2 px-1 py-1 bg-black-alpha-10 border-round-sm">
					<Icon source_id="arrow_split" source="material-symbols" />
					<span class="text-secondary">Split {{ i + 1 }}</span>
					<div class="flex-grow-1" />
					<Currency :amount="attribution.amount" mode="transaction" />
				</h4>
				<div class="details-rows">
					<div class="row">
						<label>Memo</label>
						<Button
							text
							:severity="attribution.memo ? 'contrast' : 'secondary'"
							class="flex align-items-center gap-2"
							@click="() => promptForMemo(attribution)"
						>
							{{ attribution.memo || 'None' }}
						</Button>
					</div>

					<div class="row">
						<label>Budget</label>
						<Button
							text
							:severity="attribution.Budget ? 'contrast' : 'secondary'"
							class="flex align-items-center gap-2"
							@click="() => doAttributionDrawer('Budget', attribution)"
						>
							<template v-if="attribution.Budget">
								{{ attribution.Budget.memo }}
								<span v-if="attribution.BudgetChildItem"
									>- {{ attribution.BudgetChildItem.memo }}</span
								>
							</template>
							<template v-else> Unbudgeted </template>
						</Button>
					</div>

					<div class="row">
						<label>Category</label>
						<Button
							text
							:severity="attribution.Category ? 'contrast' : 'secondary'"
							class="flex align-items-center gap-2"
							@click="() => doAttributionDrawer('Category', attribution)"
						>
							<Icon
								:name="
									attribution.Category?.icon ||
									attribution.Category?.ParentCategory?.icon ||
									'question-circle'
								"
							/>
							{{ attribution.Category?.name || 'Uncategorized' }}
						</Button>
					</div>

					<div class="row">
						<label>Group</label>
						<Button
							text
							:severity="attribution.Group ? 'contrast' : 'secondary'"
							class="flex align-items-center gap-2"
							@click="() => doAttributionDrawer('Group', attribution)"
						>
							<template v-if="attribution.Group">
								<Icon name="tag" fill :color="attribution.Group.color || '#aaa'" />
								{{ attribution.Group.name }}
							</template>
							<template v-else> No Group </template>
						</Button>
					</div>

				</div>
			</div>

			<br />

			<Button link
				v-if="isSplit"
				class="flex align-items-center justify-content-center gap-2"
				@click="showMoreFields = !showMoreFields"
			>
				<div></div>
				{{ showMoreFields ? 'Less Details' : 'More Details' }}
				<i class="pi pi-angle-down transition-all transition-duration-300" :class="{ 'rotate-180': showMoreFields }" />
			</Button>
			<div class="max-h-0 overflow-hidden transition-all transition-duration-300" :class="{ 'max-h-30rem': showMoreFields || !isSplit }">
				<div class="details-rows">
					<div class="row">
						<label>Merchant</label>
						<div class="flex align-items-center gap-2">
							<Button
								text
								:severity="transaction.Merchant ? 'contrast' : 'secondary'"
								class="flex align-items-center gap-2"
								@click="selectMerchant"
							>
								{{ transaction.Merchant?.name || 'Unknown' }}
							</Button>
						</div>
					</div>

					<div class="row">
						<label>Notes</label>
						<Textarea
							v-model="notesDraft"
							rows="3"
							class="w-full"
						/>
					</div>
				</div>
			</div>

			<div class="flex-grow-1" />

			<Button class="w-full" text @click="openSplitModal">
				<Icon source_id="arrow_split" source="material-symbols" />
				{{ isSplit ? 'Manage Splits' : 'Split Transaction' }}
			</Button>
		</div>
	</NavTriggerDrawer>

	
	<DrawerModal ref="splitModal" title="Split Transaction">
		<div
			v-for="attribution of draftAttributions"
			class="flex align-items-center gap-3 mb-2"
		>
			<AttributionAvatar :event="attribution" :size="2.4" @click="doAttributionDrawer('Budget', attribution)" class="cursor-pointer" />
			<div class="flex flex-column w-full min-w-0">
				<div class="text-ellipsis text-semibold w-full min-w-0">
					{{ attribution.memo || 'Unnamed Split' }}
				</div>
				<small class="text-ellipsis w-full min-w-0">
					{{ attribution.Budget?.memo ? attribution.Budget.memo + ' - ' : '' }}
					{{ useCategoryStore().getCategoryById(attribution.category_id).name }}
				</small>
			</div>
			<div class="flex">
				<InputNumber
					v-model="attribution.amount"
					mode="currency"
					:currency="transaction.iso_currency_code || 'USD'"
					:min="0"
					:max="Math.abs(transaction.amount)"
					class="w-7rem text-right"
					:class="{ showFillButton: splitTotalDiff < 0 }"
					@input="({ value }) => handleSplitAmountChange(value as number, attribution)"
					style="order: 1"
				/>
				<div
					class="fill-split-button max-w-0 overflow-hidden"
				>
					<Button
						text
						severity="secondary"
						icon="pi pi-angle-double-up"
						@click="attribution.amount += Math.abs(splitTotalDiff)"
						style="order: 0"
					/>
				</div>
				<Button
					v-if="draftAttributions.length > 1"
					text
					severity="secondary"
					icon="pi pi-trash"
					@click="async () => {
						if (await usePrompt().delete({
							title: 'Remove Split',
							message: 'Are you sure you want to remove this split?',
						})) {
							draftAttributions.splice(draftAttributions.indexOf(attribution), 1)
						}
					}"
					style="order: 2"
				/>
			</div>
		</div>

		<br />
		<Button 
			text
			icon="pi pi-plus"
			label="Add Split"
			@click="createNewSplit"
		/>

		<br />
		<br />
		<div class="flex flex-column">
			<Button
				:disabled="!splitsAreFull"
				@click="saveSplitChanges"
			>
				<div v-if="splitsAreFull">{{ 'Save Splits' }}</div>
				<div v-else>
					<Currency :amount="splitTotalDiff" />
					missing
				</div>
			</Button>
			<Button text label="Cancel" @click="cancelSplitChanges" />
		</div>
	</DrawerModal>

	<TransactionAttributionDrawer ref="transactionAttributionDrawer" />
	<MerchantSelectionDrawer ref="merchantSelectionDrawer" :key="transaction.transaction_id" />
</template>

<style scoped lang="scss">
:deep(.details-rows) {
	.row {
		display: flex;
		align-items: top;
		gap: 1rem;

		> label {
			--width: 7em;
			--min-height: 2.5rem;
			min-height: var(--min-height);
			line-height: var(--min-height);
			opacity: 0.75;
			min-width: var(--width);
			max-width: var(--width);
		}
	}
}

.fill-split-button {
	transition: max-width 0.2s ease-in-out;
}
:deep(.p-inputwrapper-focus.showFillButton) + .fill-split-button {
    max-width: 3rem !important;
}
</style>
