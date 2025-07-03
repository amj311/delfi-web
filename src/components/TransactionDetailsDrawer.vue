<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import Drawer from 'primevue/drawer';
import { useRouter } from 'vue-router';
import TransactionAvatar from './TransactionAvatar.vue';
import type { Transaction } from 'delfi-core/models/Transaction';
import Currency from './Currency.vue';
import { useAccountStore } from '@/stores/account.store';
import NavTrigger from './utils/NavTrigger.vue';
import Button from 'primevue/button';
import Icon from './Icon.vue';
import CategorySelectDrawer from './CategorySelectDrawer.vue';
import { useCategoryStore } from '@/stores/category.store';
import { TransactionService } from '@/services/transaction.service';
import { useDelfiStore } from '@/stores/delfi.store';
import BudgetSelectDrawer from './BudgetSelectDrawer.vue';
import { useBudgetStore } from '@/stores/budget.store';
import { useGroupStore } from '@/stores/group.store';
import TransactionAttributionDrawer, { type Step } from './TransactionAttributionDrawer.vue';
import InlineInput from './utils/InlineInput.vue';
import { usePrompt } from './utils/PromptModal.vue';

const transaction = defineModel<Transaction>('transaction', {
	required: true,
});

const drawerTrigger = ref<InstanceType<typeof NavTrigger> | null>(null);
// const categorySelectDrawer = ref<InstanceType<typeof CategorySelectDrawer> | null>(null);
// const budgetSelectDrawer = ref<InstanceType<typeof BudgetSelectDrawer> | null>(null);
const transactionAttributionDrawer = ref<InstanceType<typeof TransactionAttributionDrawer> | null>(null);

defineExpose({
	open: drawerTrigger.value?.open,
	close: drawerTrigger.value?.close,
});

onMounted(() => {
	if (drawerTrigger.value) {
		drawerTrigger.value.open();
	}
});

const saving = ref(false);
const lastSaved = ref<Date | null>(null);

watch(() => transaction.value, async (newTransaction) => {
	saving.value = true;
	try {
		await TransactionService.updateTransaction(transaction.value.transaction_id, newTransaction);
		lastSaved.value = new Date();
		useDelfiStore().reCompute();
	} catch (error) {
		console.error('Error saving transaction:', error);
	} finally {
		saving.value = false;
	}
}, { deep: true });

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
	}
})

const account = computed(() => {
	return useAccountStore().getAccountById(transaction.value.account_id);
});

// function assignBudget(attribution: Transaction["Attributions"][number], budget_id: string | null, budget_child_item_id: string | null) {
// 	const budget = useBudgetStore().getBudgetById(budget_id);
// 	const childItem = budget?.childItems?.find(item => item.budget_child_item_id === budget_child_item_id);
// 	if (budget && (budget_id !== attribution.budget_id || budget_child_item_id !== attribution.budget_child_item_id)) {
// 		attribution.budget_id = budget_id;
// 		attribution.Budget = budget;
// 		attribution.budget_child_item_id = budget_child_item_id;

// 		// copy assignments from budget. If Not available, use the attribution's values
// 		// use the child's attributes first
// 		if (childItem?.category_id || budget.category_id) {
// 			attribution.category_id = childItem?.category_id || budget.category_id;
// 			attribution.Category = useCategoryStore().getCategoryById(attribution.category_id);
// 		}
// 		if (childItem?.group_id || budget.group_id) {
// 			attribution.group_id = childItem?.group_id || budget.group_id;
// 			attribution.Group = useGroupStore().getGroupById(attribution.group_id);
// 		}
// 	}
// }

// function assignCategory(attribution: Transaction["Attributions"][number], selectedCategoryId: string | null) {
// 	if (selectedCategoryId !== attribution.category_id) {
// 		attribution.category_id = selectedCategoryId;
// 		attribution.Category = useCategoryStore().getCategoryById(selectedCategoryId);
// 	}
// }

async function doAttributionDrawer(step: Step, attribution: Transaction["Attributions"][number] = largestAttribution.value) {
	if (transactionAttributionDrawer.value) {
		const selection = await transactionAttributionDrawer.value.waitForSelection(attribution, step);
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

async function promptForMemo(attribution: Transaction["Attributions"][number]) {
	const result = await usePrompt().prompt({
		title: 'Edit Memo',
		message: 'Enter a memo for this transaction:',
		defaultValue: attribution.memo || '',
		placeholder: 'Enter memo...',
	});
	if (result !== null) {
		attribution.memo = result.trim();
	}
}

</script>

<template>
	<NavTrigger
		ref="drawerTrigger"
		:triggerKey="'transaction-details-' + transaction.transaction_id"
	>
		<template #default="{ show }">
			<Drawer
				:visible="show"
				position="right"
				header=" "
				class="w-full sm:w-30rem"
			>
				<template #closebutton>
					<Button
						icon="pi pi-times"
						size="small"
						text
						@click="drawerTrigger?.close"
						severity="secondary"
					/>
				</template>
				<div class="flex align-items-center gap-3">
					<div><TransactionAvatar :event="avatarDetails" :size="3" /></div>
					<div class="flex-frow-1 min-w-0">
						<h3 class="m-0 text-ellipsis w-full min-w-0">{{ transaction.Merchant?.name || transaction.original_description }}</h3>
						<div>{{ transaction.date.formatFull() }}</div>
					</div>
				</div>
				<div class="text-3xl my-3"><Currency
					:amount="transaction.amount"
					mode="transaction"
				/></div>

				<div style="font-family: monospace; opacity: .8; line-height: 1.2; font-size: .9em; word-break: break-all;">{{ transaction.original_description }}</div>
				<div class="flex align-items-center gap-2 my-2">
					<div class="border-round-sm square w-1rem" :style="{ backgroundImage: `url(${account?.Institution.logo})`, backgroundSize: 'cover' }"></div>
					<span>{{ account?.display_name || account?.external_name }} - {{  account?.Institution.name }}</span>
				</div>

				<br />

				<div class="details-rows">

					<div class="row">
						<label>Memo</label>
						<Button size="small" text :severity="largestAttribution.memo ? 'contrast' : 'secondary'" class="flex align-items-center gap-2"
							@click="() => promptForMemo(largestAttribution)"
						>
							{{ largestAttribution.memo || 'None' }}
						</Button>
					</div>


					<div class="row">
						<label>Budget</label>
						<Button size="small" text :severity="largestAttribution.Budget ? 'contrast' : 'secondary'" class="flex align-items-center gap-2"
							@click="() => doAttributionDrawer('Budget')"
						>
							<template v-if="largestAttribution.Budget">
								{{ largestAttribution.Budget.memo }}
								<span v-if="largestAttribution.BudgetChildItem">- {{ largestAttribution.BudgetChildItem.memo }}</span>
							</template>
							<template v-else>
								Unbudgeted
							</template>
						</Button>
					</div>

					<div class="row">
						<label>Category</label>
						<Button size="small" text :severity="largestAttribution.Category ? 'contrast' : 'secondary'" class="flex align-items-center gap-2"
							@click="() => doAttributionDrawer('Category')"
							:disabled="Boolean(largestAttribution.Budget?.category_id)"
						>
							<Icon :name="largestAttribution.Category?.icon || largestAttribution.Category?.ParentCategory?.icon || 'question-circle'" />
							{{ largestAttribution.Category?.name || 'Uncategorized' }}
						</Button>
					</div>

					<div class="row">
						<label>Group</label>
						<Button size="small" text :severity="largestAttribution.Group ? 'contrast' : 'secondary'" class="flex align-items-center gap-2"
							@click="() => doAttributionDrawer('Group')"
							:disabled="Boolean(largestAttribution.Budget?.group_id)"
						>
							<template v-if="largestAttribution.Group">
								<Icon name="tag" fill :color="largestAttribution.Group.color || '#aaa'" />
								{{ largestAttribution.Group.name }}
							</template>
							<template v-else>
								No Group
							</template>
						</Button>
					</div>
				</div>

			</Drawer>
		</template>
	</NavTrigger>

	<!-- <CategorySelectDrawer ref="categorySelectDrawer" />
	<BudgetSelectDrawer ref="budgetSelectDrawer" /> -->
	<TransactionAttributionDrawer ref="transactionAttributionDrawer" />
</template>

<style scoped lang="scss">
.details-rows {
	.row {
		display: flex;
		align-items: center;
		gap: 1rem;

		> label {
			--width: 7em;
			opacity: .75;
			min-width: var(--width);
			max-width: var(--width);
		}
	}
}
</style>
