import type { DelfiDate } from "delfi-core/utils/dateUtils"
import type { Category } from "./Category"
import type { TagColor } from "delfi-core/utils/constants"


/**
 * GROUPS AND TAGS
 * These are VERY similar, but they need to be separate because they have different purposes.
 * Groups highlight and track a subset group of transaction, usually in a fixed period of time, like a particular vacation.
 * A transaction might only ever need one group.
 * 
 * Tags are more generally applied to any transaction at any time. They don't have any particular use for the system, but users can filter by them.
 * 
 * These need to be different, because I wouldn't want to show a whole "group" on a budget view just because a single transaction ad a vague tag on it.
 */

//
export type Tag = {
	// details
	name: string,
	color: TagColor,

	// DB
	tag_id?: string,
	workspace_id?: string,
}

export type Group = {
	// details
	name: string,
	color: TagColor,

	// DB
	group_id?: string,
	workspace_id?: string,
}

// PROBLEM Transactions can be shown in a list as the parent with their splits, but the splits also need to be handled individually for attributing
//         How and when to represent each?
//         At the least I need a function to generate the individual split events that behave like full events
//

// The Budgetable details that come from a true transaction
type TrueBudgetableDetails = {
	account_id: string,
	merchant_id?: string | null,
}


type AttributionBudgetableDetails = {
	target_account_partition_id?: string,
	category_id: string | null,
	// ABOUT INCLUDING CATEGORIES: it may be expensive to include categories over API calls
	// If so, we'll need to define different type that joins entities like this in the client
	Category?: Category | null,
	tag_ids?: string[],
	Tags?: Array<Tag>,
	group_id?: string,
	Group?: Group,
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
	authorized_date?: DelfiDate | null, // The date the transaction was authorized, if different from the date
	amount: number,
	original_description: string,
	
	pending?: boolean,
	done_pending?: boolean, // If the transaction was pending, but is no longer
	pending_transaction_id?: string | null, // If this transaction was created from a pending transaction, the ID of that pending transaction
	
	iso_currency_code?: string | null,
	notes?: string | null,
	location?: {
		address?: string | null,
		city?: string | null,
		region?: string | null,
		postal?: string | null,
		lat?: number | null,
		lon?: number | null,
	} | null,

    source:      string, // e.g. "plaid", "manual", "imported"
    source_id?:   string | null, // e.g. plaid transaction id, manual transaction id, imported transaction id
    source_data?: any // e.g. plaid transaction data, imported transaction data
}

// TODO: POTENTIAL FALSE POSITIVES. I think it is technically possible to have two transactions with the same description and amount on the same day
// Plaid might provide different source_ids which would, but only if available
export type TransactionUniqueFields = {
	account_id: string,
	original_description: string,
	amount: number,
	date: DelfiDate,
	source_id?: string | null,
}

export type TransactionDetails = TrueBudgetableDetails & TrueEventDetails;

/**
 * A realio-trulio bank transaction
 */
export type Transaction = TrueBudgetableDetails & TrueEventDetails & {
	transaction_id: string,
	workspace_id: string,
	Attributions: TransactionAttribution[],
	Merchant?: Merchant | null,
}

export type CreateTransaction = Omit<Transaction, 'transaction_id' | 'Attributions' | 'workspace_id'> & {
	Attributions?: Array<Omit<TransactionAttribution, 'transaction_attribution_id' | 'transaction_id'>>,
}

/**
 * A compiled event that represents a single attribution as if it were a standalone transaction.
 */
type AttributedEvent = Transaction & TransactionAttribution & {
	trueTotal: number, // The total amount of the transaction, including all splits
}

export type Merchant = {
	merchant_id: string,
	name: string,
	logo?: string | null,
	plaid_merchant_id?: string | null, // The Plaid merchant ID, if available
}


export class TransactionUtils {
	public static processAttributedEvents(transactions: Array<Transaction>) {
		const attributedEvents: Array<AttributedEvent> = [];

		for (const transaction of transactions) {
			const trueTotal = transaction.Attributions.reduce((sum, attr) => sum + attr.amount, 0);

			for (const attribution of transaction.Attributions) {
				attributedEvents.push({
					...transaction,
					...attribution,
					trueTotal,
				});
			}
		}

		return attributedEvents;
	}
}