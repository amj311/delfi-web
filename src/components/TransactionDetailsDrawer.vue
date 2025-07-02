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

const transaction = defineModel<Transaction>('transaction', {
	required: true,
});

const drawerTrigger = ref<InstanceType<typeof NavTrigger> | null>(null);
const categorySelectDrawer = ref<InstanceType<typeof CategorySelectDrawer> | null>(null);
const budgetSelectDrawer = ref<InstanceType<typeof BudgetSelectDrawer> | null>(null);

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

async function assignBudget(attribution: Transaction["Attributions"][number] = largestAttribution.value) {
	if (budgetSelectDrawer.value) {
		const selectedBudgetId = await budgetSelectDrawer.value.waitForSelection(largestAttribution.value.budget_id);
		const budget = useBudgetStore().getBudgetById(selectedBudgetId);
		if (budget && selectedBudgetId !== attribution.budget_id) {
			attribution.budget_id = selectedBudgetId;
			attribution.Budget = budget;

			// copy assignments from budget
			if (budget.category_id) {
				attribution.category_id = budget.category_id;
				attribution.Category = useCategoryStore().getCategoryById(budget.category_id);
			}
			if (budget.group_id) {
				attribution.group_id = budget.group_id;
				attribution.Group = budget.Group;
			}
		}
	}
}

async function assignCategory(attribution: Transaction["Attributions"][number] = largestAttribution.value) {
	if (categorySelectDrawer.value) {
		const selectedCategoryId = await categorySelectDrawer.value.waitForSelection(largestAttribution.value.category_id);
		if (selectedCategoryId !== attribution.category_id) {
			attribution.category_id = selectedCategoryId;
			attribution.Category = useCategoryStore().getCategoryById(selectedCategoryId);
		}
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
						<label>Budget</label>
						<Button size="small" text severity="contrast" class="flex align-items-center gap-2"
							@click="() => assignBudget()"
						>
							{{ largestAttribution.Budget?.memo || 'Unbudgeted' }}
						</Button>
					</div>

					<div class="row">
						<label>Category</label>
						<Button size="small" text severity="contrast" class="flex align-items-center gap-2"
							@click="() => assignCategory()"
							:disabled="Boolean(largestAttribution.Budget?.category_id)"
						>
							<Icon :name="largestAttribution.Category?.icon || largestAttribution.Category?.ParentCategory?.icon || 'question-circle'" />
							{{ largestAttribution.Category?.name || 'Uncategorized' }}
						</Button>
					</div>
				</div>

			</Drawer>
		</template>
	</NavTrigger>

	<CategorySelectDrawer ref="categorySelectDrawer" />
	<BudgetSelectDrawer ref="budgetSelectDrawer" />
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
