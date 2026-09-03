import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { Selection } from '@/utils/Selection'
import type { CommonEvent } from 'delfi-core/models/Summary'
import { TransactionService } from '@/services/transaction.service'
import { useDelfiStore } from '@/stores/delfi.store'
import type { AttributionEvent } from 'delfi-core/models/Transaction'

export const useTransactionSelectionStore = defineStore('transactionSelection', () => {
	// Selection<CommonEvent> but the ref was too big
	const selection = ref(new Selection<any>((e) => e.attributionDetails?.transaction_attribution_id || ''))

	const numSelected = computed(() => selection.value.size)
	const selectedValues = computed(() => selection.value.values)

	const transactionAttributionDrawer = shallowRef<{ waitForSelection: (..._: any[]) => Promise<any> } | null>(null)

	function clear() {
		selection.value.clear()
	}

	async function editSelectionAttributions() {
		if (!selection.value.size) {
			return;
		}
		const selected: CommonEvent[] = selection.value.values;
		const result = await transactionAttributionDrawer.value?.waitForSelection(selected, undefined, selected[0] as AttributionEvent);
		if (!result) {
			return;
		}

		// Build only the non-undefined fields to send
		const updates: Record<string, string | null> = {};
		if (result.budget_id !== undefined) updates.budget_id = result.budget_id;
		if (result.budget_child_item_id !== undefined) updates.budget_child_item_id = result.budget_child_item_id;
		if (result.category_id !== undefined) updates.category_id = result.category_id;
		if (result.group_id !== undefined) updates.group_id = result.group_id;

		const attributionIds = selected
			.map((e) => e.attributionDetails?.transaction_attribution_id)
			.filter((id): id is string => Boolean(id));

		const updatedTransactions = await TransactionService.bulkUpdateAttributions(attributionIds, updates);
		await useDelfiStore().updateTransactions(updatedTransactions);
	}

	return {
		selection,
		numSelected,
		selectedValues,
		transactionAttributionDrawer,
		editSelectionAttributions,
		clear,
	}
})
