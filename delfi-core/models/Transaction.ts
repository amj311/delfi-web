import type { DelfiDate } from "delfi-core/utils/dateUtils"
import type { Category } from "./Category"


// PROBLEM Transactions can be shown in a list as the parent with their splits, but the splits also need to be handled individually for attributing
//         How and when to represent each?
//         At the least I need a function to generate the individual split events that behave like full events
//

// The Budgetable details that come from a true transaction
type TrueBudgetableDetails = {
	target_account_id: string,
	merchant_id?: string | null,
}


type AttributionBudgetableDetails = {
	target_account_partition_id?: string,
	category_id?: string | null,
	// ABOUT INCLUDING CATEGORIES: it may be expensive to include categories over API calls
	// If so, we'll need to define different type that joins entities like this in the client
	Category?: Category | null,
	tagIds?: string[],
	memo?: string | null,
	budget_id?: string | null,
}

// Provide these details for consistency with Budgets
export type BudgetableTransactionDetails = TrueBudgetableDetails & AttributionBudgetableDetails;


type AttributionEventDetails = {
	amount: number,
}
type TransactionAttribution = AttributionBudgetableDetails & AttributionEventDetails & {
	transaction_attribution_id: string,
	transaction_id: string,
	amount: number,
}


// The details that are available for events from true transactions but NOT Budgetable
type TrueEventDetails = {
	date: DelfiDate,
	amount: number,
	original_description: string,
	pending?: boolean,
	iso_currency_code?: string | null,
	notes?: string | null,
	location: {
		address?: string | null,
		city?: string | null,
		region?: string | null,
		postal?: string | null,
		lat?: number | null,
		lon?: number | null,
	}
}

type TrueTransaction = TrueBudgetableDetails & TrueEventDetails & {
	transaction_id: string,

    source:      string, // e.g. "plaid", "manual", "imported"
    source_id?:   string | null, // e.g. plaid transaction id, manual transaction id, imported transaction id
    source_data?: any // e.g. plaid transaction data, imported transaction data

	Attributions: TransactionAttribution[],
}

/**
 * A compiled event that represents a single attribution as if it were a standalone transaction.
 */
type AttributedEvent = TrueEventDetails & TransactionAttribution & {
	trueTotal: number, // The total amount of the transaction, including all splits
}