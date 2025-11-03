<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { TransactionUtils, type Transaction } from 'delfi-core/models/Transaction';
import Currency from './Currency.vue';
import { useAccountStore } from '@/stores/account.store';
import Button from 'primevue/button';
import Icon from './Icon.vue';
import { TransactionService } from '@/services/transaction.service';
import { useDelfiStore } from '@/stores/delfi.store';
import TransactionAttributionDrawer, { type Step } from './TransactionAttributionDrawer.vue';
import { usePrompt } from './utils/PromptModal.vue';
import { asAny, diff as getDiff, jsonCopy } from 'delfi-core/utils/miscUtils';
import AttributionAvatar from './AttributionAvatar.vue';
import Textarea from 'primevue/textarea';
import debounce from '@/utils/debounce';
import NavTriggerDrawer from './utils/NavTrigger/NavTriggerDrawer.vue';
import DrawerModal from './utils/DrawerModal.vue';
import { useCategoryStore } from '@/stores/category.store';
import InputNumber from 'primevue/inputnumber';
import { v4 as uuid } from 'uuid';
import MerchantSelectionDrawer from './MerchantSelectionDrawer.vue';
import { useContextStore } from '@/stores/context.store';
import { ddate, instantiateDates, isDate } from 'delfi-core/utils/dateUtils';
import { ActionTypes, type ActionType, type TransactionRule } from 'delfi-core/models/TransactionRule';
import { useToast } from './utils/Toast.vue';
import RulesList from './RulesList.vue';
import DatePicker from 'primevue/datepicker';

const triggerRef = ref<InstanceType<typeof NavTriggerDrawer> | null>(null);
const transaction = ref<Transaction>({} as Transaction);

const props = defineProps<{
	onClose?: () => void;
}>();

defineExpose({
	open: (_transaction: Transaction) => {
		transaction.value = _transaction;
		notesDraft.value = transaction.value.notes;
		budgetDateDate.value = transaction.value.budget_date?.toDate();
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
			const diff = getDiff(oldValue, newTransaction) || {};
			const diffKeys = Object.keys(diff);
			const shouldCompute = diffKeys.some((key) => !computeExclusions.includes(key));
			if (shouldCompute) {
				useDelfiStore().reCompute();
			}

			const changedRuleActions = ActionTypes.map((key) => {
				const change = Object.entries(diff).find(([dKey]) => dKey.includes(key)); // Attributions.0.merchant_id includes merchant_id
				if (!change) {
					return null;
				}
				return {
					actionType: key,
					value: asAny(change[1]).new,
				};
			}).filter(Boolean) as Array<{ actionType: ActionType, value: any }>;
			const existingRuleActions = applicableRules.value.flatMap((rule) => rule.actions.map((action) => action.action));
			// Prompt to add rule if one does not exist for this action yet
			const shouldPromptRule = changedRuleActions.some(({actionType}) => !existingRuleActions.some((action) => actionType === action));
			if (shouldPromptRule) {
				promptNewRule(changedRuleActions);
			}
		} catch (error) {
			console.error('Error saving transaction:', error);
		} finally {
			saving.value = false;
		}
	}
);

async function doAttributionDrawer(step: Step, attribution: Transaction['Attributions'][number]) {
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
		const selection = await merchantSelectionDrawer.value.selectMerchant(
			transaction.value.Merchant?.merchant_id || null,
			transaction.value.transaction_id
		);
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

/**************
 * SPLITS
 */

const isSplit = computed(() => {
	return transaction.value.Attributions.length > 1;
});

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
		transaction_id: transaction.value.transaction_id,
	});
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
			title: 'Splits must sum to the total transaction amount.',
			duration: 3000,
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
	transaction.value.Attributions = draftAttributions.value
		.sort((a, b) => b.amount - a.amount)
		.map((attr) => ({
			...attr,
			amount: Math.sign(transaction.value.amount) * attr.amount, // Store as absolute value
		}))
		.filter((attr) => attr.amount !== 0); // Remove empty splits
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

/***************
 * TRANSFERS
 */

/** Filters transaction from current context to those matching this transaction */
function getTransferCandidates() {
	return (
		useContextStore().currentSummary?.attributionEvents.filter(
			(e) =>
				!e.attributionDetails.transfer_pair_id &&
				e.attributionDetails.sourceTransaction.transaction_id !== transaction.value.transaction_id &&
				e.attributionDetails.sourceTransaction.account_id !== transaction.value.account_id &&
				e.attributionDetails.sourceTransaction.amount === -transaction.value.amount
		) || []
	);
}

const isTransferPair = computed(() => {
	return Boolean(transaction.value.TransferPair);
});
const transferPair = computed(() => {
	return isTransferPair.value ? [transaction.value, transaction.value.TransferPair!] : [];
});
const transferSource = computed(() => {
	return transferPair.value.find((t) => t.amount <= 0) || null;
});
const transferTarget = computed(() => {
	return transferPair.value.find((t) => t.amount > 0) || null;
});

const transferPairModal = ref<InstanceType<typeof DrawerModal> | null>(null);

function cancelTransferPair() {
	if (transferPairModal.value) {
		transferPairModal.value.close();
	}
}
function openTransferPairModal() {
	if (transferPairModal.value) {
		transferPairModal.value.open();
	}
}
function setTransferPair(t: Transaction) {
	transaction.value.TransferPair = t;
	transaction.value.transfer_pair_id = t.transaction_id;
	transferPairModal.value?.close();
}

async function breakTransferPair() {
	if (!isTransferPair.value) {
		return;
	}
	if (
		!(await usePrompt().delete({
			title: 'Delete Transfer Pair',
			message: 'Are you sure you want to remove this transfer pair?',
		}))
	) {
		return;
	}
	transaction.value.transfer_pair_id = null;
	transaction.value.TransferPair = null;
}

/****************
 * REVIEWS
 */

const needsReview = computed(() => {
	return (
		transaction.value.TransactionReview && !transaction.value.TransactionReview.reviewed_at && !transaction.value.TransactionReview.dismissed_at
	);
});

async function reviewTransaction() {
	try {
		await TransactionService.markTransactionReviewed(transaction.value.transaction_id);
		transaction.value.TransactionReview = {
			...transaction.value.TransactionReview!,
			reviewed_at: new Date(),
		};
		useToast().add({
			severity: 'success',
			title: 'Transaction Reviewed',
			duration: 3000,
		});
	} catch (error) {
		console.error('Error reviewing transaction:', error);
		useToast().add({
			severity: 'error',
			title: 'Failed to mark transaction as reviewed.',
			message: 'Please try again later.',
		});
	}
}

/****************
 * RULES
 */

const ruleDrawerRef = ref<InstanceType<typeof NavTriggerDrawer> | null>(null);
const rulesListRef = ref<InstanceType<typeof RulesList> | null>(null);

const applicableRules = ref<TransactionRule[]>([]);
// Watch for transaction changes to load applicable rules
watch(
	() => transaction.value.transaction_id,
	async (newTransactionId) => {
		if (newTransactionId) {
			try {
				applicableRules.value = await TransactionService.getApplicableRules(newTransactionId);
			} catch (error) {
				console.error('Error loading applicable rules:', error);
				applicableRules.value = [];
			}
		} else {
			applicableRules.value = [];
		}
	},
	{ immediate: true }
);

function promptNewRule(newActionFields: Array<{ actionType: ActionType, value: any }>) {
	useToast().add({
		icon: 'material-symbols::manufacturing',
		title: 'Attributions updated',
		okButtonProps: {
			label: 'Create Rule',
		},
		onOk: () => draftNewRule(newActionFields),
	});
}

function draftNewRule(newActionFields: Array<{ actionType: ActionType, value: any }>) {
	openRules();
	nextTick(() => {
		rulesListRef.value?.draftRule({
			filter: { AND: [ { property: '' as any, operator: '' as any } ] },
			actions: newActionFields.map(field => ({ action: field.actionType, value: { [field.actionType]: field.value } }))
		});
	})
}

function openRules() {
	if (ruleDrawerRef.value) {
		ruleDrawerRef.value.trigger()?.open();
	}
}




/*****************
 * DATES
 */

 // Need to convert dates to Date and back for DatePicker
 const budgetDateDate = ref(transaction.value.budget_date?.toDate());
 watch(budgetDateDate, (val) => { transaction.value.budget_date = isDate(val) ? ddate(val) : null });


/***************
 * DISPLAY
 */

const headerTitle = computed(() => {
	let detailSource = isTransferPair.value ? transferSource.value! : transaction.value;
	return TransactionUtils.getSimplifiedIdentifier(detailSource.original_description)?.identifier || detailSource.original_description;
});

const displayAmount = computed(() => {
	return isTransferPair.value ? transferSource.value!.amount : transaction.value.amount;
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
const targetAccount = computed(() => {
	return useAccountStore().getAccountById(transferTarget.value?.account_id);
});
const sourceAccount = computed(() => {
	return useAccountStore().getAccountById(transferSource.value?.account_id);
});
</script>

<template>
	<NavTriggerDrawer ref="triggerRef" :triggerKey="'transaction-details'" @close="() => onClose && onClose()">
		<template #header>
			<div class="flex w-full mr-3">
				<div class="flex-grow-1"></div>
				<div class="flex align-items-center gap-2 text-sm text-black-alpha-50">
					<template v-if="saving">
						<i class="pi pi-spin pi-spinner"></i>
						Saving...
					</template>
					<template v-else-if="lastSaved">
						<i class="pi pi-check"></i>
						<span>Saved</span>
					</template>
				</div>
			</div>
		</template>

		<div class="flex flex-column h-full overflow-y-auto">
			<div class="flex align-items-center gap-3">
				<AttributionAvatar :event="avatarDetails" :size="3" />
				<div class="flex-frow-1 min-w-0">
					<h3 class="m-0 text-ellipsis w-full min-w-0">{{ headerTitle }}</h3>
					<div>{{ transaction.date.format('full') }}</div>
				</div>
			</div>
			<div class="text-4xl my-4">
				<Currency :amount="displayAmount" mode="transaction" />
			</div>


			<!-- TRANSFER PAIR ACCOUNTS -->
			<template v-if="isTransferPair">
				<div class="flex align-items-center justify-content-between gap-3">
					<div class="flex align-items-center gap-2 min-w-0" style="width: 50%">
						<div
							class="border-round-sm square"
							:style="{
								backgroundImage: `url(${sourceAccount?.Institution.logo})`,
								backgroundSize: 'cover',
								minWidth: '2.5rem',
								maxWidth: '2.5rem',
							}"
						></div>
						<div class="text-ellipsis">
							<div class="font-medium">{{ sourceAccount?.display_name || sourceAccount?.external_name }}</div>
							<small>{{ sourceAccount?.Institution.name }}</small>
						</div>
					</div>

					<i class="pi pi-arrow-right text-2xl"></i>

					<div class="flex align-items-center gap-2 min-w-0" style="width: 50%">
						<div
							class="border-round-sm square"
							:style="{
								backgroundImage: `url(${targetAccount?.Institution.logo})`,
								backgroundSize: 'cover',
								minWidth: '2.5rem',
								maxWidth: '2.5rem',
							}"
						></div>
						<div class="text-ellipsis">
							<div class="font-medium">{{ targetAccount?.display_name || targetAccount?.external_name }}</div>
							<small>{{ targetAccount?.Institution.name }}</small>
						</div>
					</div>
				</div>
			</template>
			<template v-else>
				<div style="font-family: monospace; opacity: 0.8; line-height: 1.2; font-size: 0.9em; word-break: break-all">
					{{ transaction.original_description }}
				</div>
				<div class="flex align-items-center gap-2 my-2">
					<div
						class="border-round-sm square w-1rem"
						:style="{
							backgroundImage: `url(${account?.Institution.logo})`,
							backgroundSize: 'cover',
						}"
					></div>
					<span>{{ account?.display_name || account?.external_name }} - {{ account?.Institution.name }}</span>
				</div>
			</template>

			<div class="mt-3"></div>

			<!-- REVIEW -->
			<div v-if="needsReview" class="py-3 px-3 bg-blue-100 border-round mb-3 flex align-items-center gap-3">
				<div>
					<p class="font-semibold">Review Transaction</p>
					<p>Is this transaction good-to-go?</p>
				</div>
				<div class="flex-grow-1"></div>
				<Button severity="info" icon="pi pi-thumbs-up" size="large" @click="reviewTransaction" />
			</div>

			<div v-for="(attribution, i) in transaction.Attributions" :key="attribution.transaction_attribution_id">
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
							<template v-if=attribution.memo>{{ attribution.memo }}</template>
							<template v-else>
								None<template v-if=attribution.memo>{{ attribution.memo }}</template>
							<template v-else>
								None
								<i class="pi pi-pencil" />
							</template>
							</template>
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
								<span v-if="attribution.BudgetChildItem">- {{ attribution.BudgetChildItem.memo }}</span>
							</template>
							<template v-else>
								Unbudgeted
								<i class="pi pi-pencil" />
							</template>
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
							<Icon :name="attribution.Category?.icon || attribution.Category?.ParentCategory?.icon || 'question-circle'" />
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
							<template v-else>
								No Group
								<i class="pi pi-pencil" />
							</template>
						</Button>
					</div>
				</div>
			</div>

			<br />

			<!-- <Button link v-if="isSplit" class="flex align-items-center justify-content-center gap-2" @click="showMoreFields = !showMoreFields">
				<div></div>
				{{ showMoreFields ? 'Less Details' : 'More Details' }}
				<i class="pi pi-angle-down transition-all transition-duration-300" :class="{ 'rotate-180': showMoreFields }" />
			</Button> -->
			<!-- <div class="max-h-0 overflow-hidden transition-all transition-duration-300" :class="{ 'max-h-30rem': showMoreFields || !isSplit }"> -->
				<div class="details-rows">
					<!-- No merchant for transfers! -->
					<div class="row" v-if="!isTransferPair">
						<label>Merchant</label>
						<div class="flex align-items-center gap-2">
							<Button
								text
								:severity="transaction.Merchant ? 'contrast' : 'secondary'"
								class="flex align-items-center gap-2"
								@click="selectMerchant"
							>
								<template v-if="transaction.Merchant">{{ transaction.Merchant.name }}</template>
								<template v-else>
									Unknown
									<i class="pi pi-pencil" />
								</template>
							</Button>
						</div>
					</div>

					<div class="row">
						<label>Adjusted Date</label>
						<div class="flex align-items-center gap-2">
							<DatePicker v-model="budgetDateDate" showIcon showClear :clearButtonProps="{}" />
						</div>
					</div>

					<div class="row">
						<label>Notes</label>
						<Textarea v-model="notesDraft" rows="3" class="w-full" />
					</div>
				<!-- </div> -->
				<br />

				<div class="text-black-alpha-50">
					<div v-if="transaction.TransactionReview?.reviewed_at">
						<i class="pi pi-check-circle" />&nbsp;
						<!-- Reviewed by {{ transaction.TransactionReview.ReviewedBy?.given_name }} on -->
						Reviewed on
						{{ ddate(transaction.TransactionReview?.reviewed_at).format('full') }}
					</div>

					<!-- APPLICABLE RULES COUNT -->
					<div>
						<Icon name="material-symbols::manufacturing" />&nbsp;
						{{ applicableRules.length }} automation {{ applicableRules.length === 1 ? 'rule applies' : 'rules apply' }} to this transaction.
						<Button size="small" text label="View Rules" @click="openRules" />
					</div>
				</div>
			</div>

			<div class="flex-grow-1" />

			<div>
				<!-- SPLITS -->
				<Button v-if="!isTransferPair" class="w-full" text @click="openSplitModal">
					<Icon source_id="arrow_split" source="material-symbols" />
					{{ isSplit ? 'Manage Splits' : 'Split Transaction' }}
				</Button>

				<!-- TRANSFER PAIRS -->
				<Button v-if="!isSplit && !isTransferPair" class="w-full" text @click="openTransferPairModal">
					<Icon source_id="compare_arrows" source="material-symbols" />
					Create transfer pair
				</Button>
				<Button v-if="!isSplit && isTransferPair" class="w-full" text severity="danger" @click="breakTransferPair">
					<Icon source_id="arrows_outward" source="material-symbols" />
					Break transfer pair
				</Button>
			</div>
		</div>
	</NavTriggerDrawer>

	<DrawerModal ref="splitModal" title="Split Transaction">
		<div v-for="attribution of draftAttributions" class="flex align-items-center gap-3 mb-2">
			<AttributionAvatar :event="attribution" :size="2.4" @click="doAttributionDrawer('Budget', attribution)" class="cursor-pointer" />
			<div class="flex flex-column align-items-start w-full min-w-0">
				<Button text severity="contrast" class="p-0 w-auto text-ellipsis text-semibold w-full min-w-0" @click="promptForMemo(attribution)">
					{{ attribution.memo || 'Add memo...' }}
				</Button>
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
					@blur="({ value }) => { handleSplitAmountChange(value as unknown as number, attribution) }"
					style="order: 1"
					size="large"
				/>
				<div class="fill-split-button max-w-0 overflow-hidden">
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
					@click="
						async () => {
							if (
								await usePrompt().delete({
									title: 'Remove Split',
									message: 'Are you sure you want to remove this split?',
								})
							) {
								draftAttributions.splice(draftAttributions.indexOf(attribution), 1);
							}
						}
					"
					style="order: 2"
				/>
			</div>
		</div>

		<br />
		<Button text icon="pi pi-plus" label="Add Split" @click="createNewSplit" />

		<br />
		<br />
		<div class="flex flex-column">
			<Button :disabled="!splitsAreFull" @click="saveSplitChanges">
				<div v-if="splitsAreFull">{{ 'Save Splits' }}</div>
				<div v-else>
					<Currency :amount="splitTotalDiff" />
					missing
				</div>
			</Button>
			<Button text label="Cancel" @click="cancelSplitChanges" />
		</div>
	</DrawerModal>

	<DrawerModal ref="transferPairModal" title="Select Transfer Transaction">
		<div
			v-for="event of getTransferCandidates()"
			class="flex align-items-center gap-3 cursor-pointer hover:bg-gray-100 p-2 border-round"
			@click="setTransferPair(event.attributionDetails.sourceTransaction)"
		>
			<div>
				<AttributionAvatar :event="event" style="width: 2.5rem; font-size: 1.2rem">
					<template #badge v-if="event.isSplit">
						<Icon source_id="arrow_split" source="material-symbols" />
					</template>
				</AttributionAvatar>
			</div>
			<div class="flex flex-column w-full min-w-0">
				<div class="flex align-items-center gap-2">
					<div class="flex align-items-center w-full min-w-0">
						<div class="text-ellipsis">
							<span class="font-medium">{{ event.displayName }}</span>
							<small v-if="event.memo">&nbsp;- {{ event.softDescription }}</small>
						</div>
					</div>
					<div style="flex-grow: 1"></div>
					<div class="font-medium flex align-items-center gap-1">
						<Currency :amount="event.amount" mode="transaction" />
					</div>
				</div>
				<small class="flex text-ellipsis">
					{{ event.Budget?.memo || useCategoryStore().getCategoryById(event.category_id).name }}
					-
					{{ useAccountStore().getAccountName(event.account_id) }}
					<div class="flex-grow-1"></div>
					{{ event.date.format('full') }}
				</small>
			</div>
		</div>

		<br />
		<div class="flex flex-column">
			<Button text label="Cancel" @click="cancelTransferPair" />
		</div>
	</DrawerModal>

	<!-- TRANSACTION RULES -->
	<NavTriggerDrawer ref="ruleDrawerRef" triggerKey="transaction-applicable-rules">
		<p class="mb-2">These rules will apply to this transaction and others like it</p>

		<h3>Rules</h3>
		<RulesList
			ref="rulesListRef"
			v-model="applicableRules"
			:templateEvent="TransactionUtils.createEventFromAttribution(largestAttribution, transaction)"
			@rulesApplied="(newTransaction) => {
				transaction = instantiateDates(newTransaction) as Transaction;
			}"
		/>
		<br />
		<div>
			<Button icon="pi pi-plus" label="Add Rule" @click="rulesListRef?.draftRule()" />
		</div>
	</NavTriggerDrawer>

	<TransactionAttributionDrawer ref="transactionAttributionDrawer" />
	<MerchantSelectionDrawer ref="merchantSelectionDrawer" :key="transaction.transaction_id" />
</template>

<style scoped lang="scss">
:deep(.showFillButton) + .fill-split-button {
	max-width: 3rem !important;
}
</style>
