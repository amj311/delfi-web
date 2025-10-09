import { ddate, type DelfiDate } from "delfi-core/utils/dateUtils"
import type { Category } from "./Category"
import type { TagColor } from "delfi-core/utils/constants"
import type { CommonEvent } from "./Summary"
import type { Budget, BudgetChildItem } from "./Budget"
import { AccountUtils, type AccountSubtype } from "./Account"
import type { Optional, Replace } from "delfi-core/utils/typeUtils"


/**
 * GROUPS AND TAGS
 * These are VERY similar, but they need to be separate because they have different purposes.
 * Groups highlight and track a subset group of transactions, usually in a fixed period of time, like a particular vacation.
 * A transaction might only ever need one group.
 * 
 * Tags are more generally applied to any transaction at any time. They don't have any particular use for the system, but users can filter by them.
 * 
 * These need to be different, because I wouldn't want to show a whole "group" on a budget view just because a single transaction had a vague tag on it.
 * 
 * Ooooor, maybe they can just be the same thing. Artificial restrictions on how they are used just complicates the app.
 * Instead of making a whole special UI element for each one like a Big Group, maybe list each tag with a tally on it, and clicking 
 * will show you extra detail. That gives visibility into all tags in a non-intrusive way.
 * It also easier to dissect the info in multiple ways, with different combinations of tags.
 * 
 * I think the biggest practical distinction is how a group is very time-boxed around a specific event, while tags are more general.
 * But is that just a user;s choice?
 * 
 * I would like UI that shows the whole budget from start to end of a group, like for a vacation, even if it goes over multiple months.
 * What would that look like if it were a tag with no real start or end date?
 */

export type Tag = {
	// details
	name: string,
	color: TagColor,

	// DB
	tag_id?: string,
	workspace_id?: string,
}

export type BudgetGroup = {
	// details
	name: string,
	color: TagColor,

	// DB
	group_id: string,
	workspace_id: string,
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
	Group?: BudgetGroup | null,
}

// Provide these details for consistency with Budgets
export type BudgetableTransactionDetails = TrueBudgetableDetails & AttributionBudgetableDetails;


type AttributionDetails = {
	amount: number,
	budget_id?: string | null,
	Budget?: Budget | null,
	budget_child_item_id?: string | null,
	BudgetChildItem?: BudgetChildItem | null,
}
export type TransactionAttribution = AttributionBudgetableDetails & AttributionDetails & {
	transaction_attribution_id: string,
	transaction_id: string,
	amount: number,
	memo?: string | null,
}


// The details that are available for events from true transactions but NOT Budgetable
type TrueEventDetails = {
	date: DelfiDate,
	date_order?: string | null, // For sorting transactions from the same date, since time info is not always available. IE 2025-04-12-01 (e.g. 01 for the first transaction of the day)
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

	account_balance?: number | null, // The account balance at the time of the transaction. REQUIRED WHEN NOT PENDING!!!!!!
	transfer_pair_id?: string | null, // The ID of the transfer pair, if applicable
	TransferPair?: Transaction | null,

    source:      string, // e.g. "plaid", "manual", "imported"
    source_id?:   string | null, // e.g. plaid transaction id, manual transaction id, imported transaction id
    source_data?: any // e.g. plaid transaction data, imported transaction data
	plaid_data?: any | null, // e.g. plaid transaction data, if available
}

// TODO: POTENTIAL FALSE POSITIVES. I think it is technically possible to have two transactions with the same description and amount on the same day
// Plaid will need to compute the date_order for this to be unique
// Plaid might provide different source_ids which would, but only if available
export type TransactionUniqueFields = {
	account_id: string,
	original_description: string,
	amount: number,
	date: DelfiDate,
	date_order?: string | null, // ensures uniqueness of transactions on the same date
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
	TransactionReview?: TransactionReview | null,
}

export type CreateTransaction = Omit<Transaction, 'transaction_id' | 'Attributions' | 'workspace_id'> & {
	Attributions?: Array<Omit<TransactionAttribution, 'transaction_attribution_id' | 'transaction_id'>>,
	/** Will be applied to all attributions that don't already have a category set */
	category_id?: string | null,
}

/**
 * A compiled event that represents a single attribution as if it were a standalone transaction.
 */
export type AttributionEventDetails = TransactionAttribution & {
	sourceTransaction: Transaction,
	isSplit: boolean, // If this event is a split of a transaction
	softDescription: string,
	isTransferPair: boolean,
	isTransferCopy: boolean,
	needsReview: boolean,
}

export type AttributionEvent = Replace<CommonEvent, {
	projectionDetails: undefined,
	attributionDetails: AttributionEventDetails,
}>;

export type Merchant = {
	merchant_id: string,
	name: string,
	hostname?: string | null, // e.g. "starbucks.com" no https
	logo?: string | null,
	plaid_merchant_id?: string | null, // The Plaid merchant ID, if available
	detection_key?: string | null,
}
export type MerchantDraft = Optional<Merchant, 'merchant_id'>;

export type TransactionReview = {
	transaction_review_id: string,
	transaction_id: string,
	workspace_id: string,
	created_at: Date,
	updated_at: Date,
	AssignedTo?: User,
	ReviewedBy?: User,
	assigned_to_id?: string | null,
	reviewed_by_id?: string | null,
	reviewed_at?: Date | null,
	dismissed_at?: Date | null,
}

type User = {
	user_id: string,
	given_name: string,
	family_name: string,
	email: string,
}

export class TransactionUtils {
	public static processAttributionEvents(transactions: Array<Transaction>) {
		const attributedEvents: Array<AttributionEvent> = [];

		for (const transaction of transactions) {
			for (const attribution of transaction.Attributions) {
				attributedEvents.push(this.createEventFromAttribution(attribution, transaction));
			}
		}

		return attributedEvents;
	}

	public static createEventFromAttribution(attribution: TransactionAttribution, transaction: Transaction): AttributionEvent {
		const BudgetChildItem = attribution.Budget?.childItems?.find(item => item.budget_child_item_id === attribution.budget_child_item_id) || null;
		const breakdown = TransactionUtils.extractDescriptionInfo(transaction.original_description);

		return {
			displayName: attribution.memo || breakdown?.simple_description || transaction.original_description,
			date: transaction.date,
			day: transaction.date.day(),
			year: transaction.date.year(),
			month: transaction.date.month(),

			account_id: transaction.account_id,
			Merchant: transaction.Merchant || null,
			merchant_id: transaction.Merchant?.merchant_id || null,

			...attribution,
	
			attributionDetails: {
				...attribution,
				sourceTransaction: transaction,
				isSplit: transaction.Attributions.length > 1,
				softDescription: breakdown?.simple_description || transaction.original_description,
				isTransferPair: Boolean(transaction.transfer_pair_id),
				isTransferCopy: Boolean(transaction.transfer_pair_id) && transaction.amount < 0,
				BudgetChildItem,
				needsReview: Boolean(transaction.TransactionReview && !transaction.TransactionReview.reviewed_at && !transaction.TransactionReview.dismissed_at),
			},
			projectionDetails: undefined,
		};
	}

	/**
	 * For a given array of transactions, assigns each an order string based on it's date and the order it appears on that day.
	 * Assumes transactions are all from the same account and they represent ALL sequential transactions for their dates
	 * Date order looks like this: "2025-04-12-01" (e.g. 01 for the first transaction of the day).
	 * @param transactions 
	 * @returns 
	 */
	public static assignDateOrders<T extends {date: DelfiDate}>(transactions: Array<T>): Array<T & {date_order: string}> {
		// Make sure transactions are sorted by most recent LAST
		// detect if they are not and then reverse if needed
		const firstDate = transactions[0]?.date;
		const lastDate = transactions[transactions.length - 1]?.date;
		if (firstDate > lastDate) {
			transactions = transactions.reverse();
		}
		
		const dateTallies = new Map<string, number>();
		return transactions.map(transaction => {
			const dateKey = ddate(transaction.date).toString();
			const order = dateTallies.get(dateKey) || 0;
			dateTallies.set(dateKey, order + 1);
			const date_order = `${dateKey}-${String(order + 1).padStart(2, '0')}`;
			return {
				...transaction,
				date_order
			};
		});
	}


	/**
	 * Extracts the best merchant identifying information from a transaction description.
	 * Each possible extraction is based on a common description format.
	 */
	public static getSimplifiedIdentifier(description: string): { identifier: string, format: string } | null {
		const descriptionInfo = TransactionUtils.extractDescriptionInfo(description);
		if (!descriptionInfo) return null;

		return {
			identifier: descriptionInfo.simple_description || description,
			format: descriptionInfo.format,
		};
	}

	/**
	 * Finds a format that matches the description and extracts the applicable pieces
	 */
	public static extractDescriptionInfo(description: string): DescriptionBreakdown | null {
		for (const key in DescriptionFormats) {
			const matcher = DescriptionFormats[key];
			const match = matcher(description) as DescriptionBreakdown | null;
			if (match) {
				return match;
			}
		}

		return null; // No merchant information found
	}
}

const ACH_SEC_CODES = [
	'WEB', // Internet-Initiated Entry (e.g. online bill payments)
	'PPD', //Prearranged Payment and Deposit (most common for recurring payments)
	'TEL', //Telephone-Initiated Entry (authorized over the phone)
	'CCD', //Corporate Credit or Debit (business transactions)
	'CTX', //Corporate Trade Exchange (complex business payments)
	'TRX', //Truncated Check Entry (electronic check processing)
	'ARC', //Accounts Receivable Entry (converted paper checks)
	'POP', //Point-of-Purchase Entry (converted checks at retail)
	'RCK', //Re-presented Check Entry (bounced check retry)
] as const;
export type AchSecCode = (typeof ACH_SEC_CODES)[number];

const ACH_ENTRY_TYPES = [
	'S', // Single Entry
	'R', // Recurring Entry
] as const;
export type AchEntryType = (typeof ACH_ENTRY_TYPES)[number];

export type DescriptionBreakdown = {
	format: DescriptionFormat,
	designation?: 'transfer' | 'loan_payment' | 'cash_advance',

	simple_description?: string, // A nice readable representation of the info
	best_identifier?: string, // The most useful chunk of the description, verbatim
	merchant_name?: string,
	merchant_number?: string,

	date?: DelfiDate, // If the description includes a date, it will be parsed here

	ach_type?: string, // e.g. "AUTOMATIC WITHDRAWAL"
	ach_sec_code?: AchSecCode,
	ach_entry_type?: AchEntryType,

	card_network?: string, // e.g. "VISA", "MASTERCARD"
	phone_number?: string, // e.g. "123-456-7890"

	location_full?: string,
	location_broad?: string, // country, city, state, no street. Possible because POS puts the street address separately
	location_city?: string,
	location_region?: string,
	location_country?: string,
	location_street_address?: string,

	transfer_from_account_name?: string, // Not guaranteed to match account name exactly
	transfer_from_account_type?: AccountSubtype,
	transfer_to_account_name?: string, // Not guaranteed to match account name exactly
	transfer_to_account_type?: AccountSubtype,

	p2p_service?: string,
	p2p_recipient?: string,
	p2p_identifier?: string,
	p2p_transaction_id?: string,
	p2p_type?: 'CR' | 'DR',
}

export const DescriptionFormats = {
	ACH_X_COMMA_SEC: (description: string): DescriptionBreakdown | null => {
		const regexp = new RegExp(`^(?<type>[^,]+), (?<identifier>.+) (?<sec>(${ACH_SEC_CODES.join('|')}))( \\((?<entry>[A-Z]{1})\\))?$`);
		const match = regexp.exec(description);
		if (!match?.groups) return null;
		return {
			format: 'ACH_X_COMMA_SEC',
			simple_description: match.groups.identifier?.trim(),
			best_identifier: match.groups.identifier?.trim(),
			ach_type: match.groups.type?.trim(),
			ach_sec_code: match.groups.sec as AchSecCode,
			ach_entry_type: match.groups.entry as AchEntryType,
		};
	},

	CARD_DASH_DATE_X_REGION: (description: string): DescriptionBreakdown | null => {
		const regexp = /^(?<network>[^,]+) - (?<date>\d{2}\/\d{2}) (?<identifier>.+?) (?<region>[A-Z]{2}) (?<code>\d+)$/;
		const match = regexp.exec(description);
		if (!match?.groups) return null;

		const fullIdentifier = match.groups.identifier?.trim();

		// Extract the store number if it exists
		// Pad the front with a space to ensure it matches the regex if the store number is at the start
		let storeNumber = (" " + fullIdentifier).match(/( #?\d{2,10} )/)?.[1]?.trim() || undefined;
		const phone = fullIdentifier.match(/(\d{3}-\d{3}-\d{4})/)?.[1]?.trim() || undefined; // Extract the phone number if it exists

		// If neither phone nor store number were detected, there may still be a store number of a different format
		// Look for any string of numbers and dashes longer than a few characters. These tend to be very long
		// THANKSGIVING POINT 180-1766503 ==> [THANKSGIVING POINT, '180-1766503']
		if (!storeNumber && !phone) {
			storeNumber = fullIdentifier.match(/([-\d]{5,})/)?.[1]?.trim() || undefined;
		}
		
		// If store number or phone are in the middle of the identifier, they will separate the merchant name and the city
		// But if it starts with the store number, the two will likely be inseparable
		// DOMINO'S 9102 123-456-7890 ==> [DOMINO'S, undefined]
		// MAVERIK #380 EAGLE MOUNTAI ==> [MAVERIK, EAGLE MOUNTAI]
		// 138 ARCTIC CIRCLE EAGLE MOUNTAI ==> [ARCTIC CIRCLE EAGLE MOUNTAI, '']
		let name;
		let city;
		const merchantNameSource = (storeNumber && fullIdentifier.startsWith(storeNumber))
			? fullIdentifier.slice(storeNumber.length).trim()
			: fullIdentifier;
		if (phone || storeNumber) {
			([name, city] = merchantNameSource.split((storeNumber || '') + ' ' + (phone || '')).map(s => s.trim()));
		}
		else {
			name = merchantNameSource;
		}

		return {
			format: 'CARD_DASH_DATE_X_REGION',
			simple_description: match.groups.identifier?.trim(),
			best_identifier: match.groups.identifier?.trim(),
			merchant_name: name,
			merchant_number: storeNumber,
			phone_number: phone,
			location_city: city,
			location_region: match.groups.region?.trim(),
		};	
	},

	POS_REGION_COMMA_X_CODE: (description: string): DescriptionBreakdown | null => {
		const regexp = /^POINT OF SALE PURCHASE (?<country>[^\s]+) (?<region>[^\s]+) (?<city>[^,]+), (?<identifier>.+) - \d{12}/;
		const match = regexp.exec(description);
		if (!match?.groups) return null;

		// These often have a store number as #NNNN
		const number = match.groups.identifier.match(/ (#\d+)/)?.[1]?.trim() || undefined;
		// Addresses are often included at the very end. The must start with a number, followed by multiple words of letters and numbers
		const address = match.groups.identifier.match(/( \d{2,8} [\d\w\s]+)$/)?.[1]?.trim() || undefined;

		// If there is a number or an address, we can take everything before that as the merchant name
		let identifier_name = match.groups.identifier;
		if (number) {
			identifier_name = identifier_name.split(` ${number}`)[0]?.trim();
		}
		else if (address) {
			identifier_name = identifier_name.split(address)[0]?.trim();
		}

		return {
			format: 'POS_REGION_COMMA_X_CODE',
			simple_description: match.groups.identifier?.trim(),
			best_identifier: match.groups.identifier?.trim(),
			merchant_name: identifier_name,
			merchant_number: number,
			location_country: match.groups.country?.trim(),
			location_region: match.groups.region?.trim(),
			location_city: match.groups.city?.trim(),
			location_street_address: address,
		}
	},


	FUNDS_XFER_FROM_TO: (description: string): DescriptionBreakdown | null => {
		/**
		 * AFCU
		 * Starts with "FUNDS TRANSFER FROM"
		 * May start with "POINT OF SALE "
		 * Only observed as cash advance from line of credit
		 * 
		 * These appear to be account types rather than names
		 * 
		 * FUNDS TRANSFER FROM LINE OF CREDIT TO CHECKING
		 * MOBILE BANKING FUNDS TRANSFER TO LINE OF CREDIT
		 * MOBILE BANKING FUNDS TRANSFER FROM CHECKING
		 * POINT OF SALE FUNDS TRANSFER FROM LINE OF CREDIT TO CHECKING
		 */
		const regexp = /^(?:MOBILE BANKING |POINT OF SALE )?FUNDS TRANSFER(?:\s+FROM\s+(?<from>.+?))?\s*(?:\s+TO\s+(?<to>.*))?$/;
		const match = regexp.exec(description);
		if (!match?.groups) return null;

		const { from, to } = match.groups;

		return {
			format: 'FUNDS_XFER_FROM_TO',
			designation: 'transfer',
			simple_description: `Transfer${from ? ' from ' + from : ''}${to ? ' to ' + to : ''}`,
			transfer_from_account_type: from ? AccountUtils.matchAccountType(from.trim())?.subtype : undefined,
			transfer_to_account_type: to ? AccountUtils.matchAccountType(match.groups.to.trim())?.subtype : undefined,
		}
	},


	MOBILE_BANKING_PAYMENT_FROM: (description: string): DescriptionBreakdown | null => {
		/**
		 * AFCU
		 * Only observed as payment into credit accounts
		 * 
		 * These appear to be account types rather than names
		 * 
		 * MOBILE BANKING PAYMENT FROM MONEY MARKET
		 */
		const regexp = /^MOBILE BANKING PAYMENT FROM (?<from>.+?)$/;
		const match = regexp.exec(description);
		if (!match?.groups) return null;

		return {
			format: 'MOBILE_BANKING_PAYMENT_FROM',
			designation: 'transfer',
			simple_description: "Payment From " + match.groups.from.trim(),
			transfer_from_account_type: AccountUtils.matchAccountType(match.groups.from.trim())?.subtype,
		}
	},

	P2P_PAYMENT: (description: string): DescriptionBreakdown | null => {
		const regexp = /^(?<service>ZELLE|VENMO|PAYPAL|CASH APP|APPLE PAY) (?<recipient>[\w\s]+) (?<identifier>[^;]+);(?<transaction_id>[^;]+);(?<date>\d{4}-\d{2}-\d{2})(?:;)?(?<type>CR|DR)/;
		const match = regexp.exec(description);
		if (!match?.groups) return null;

		const type = match.groups.type.trim() as 'CR' | 'DR';

		return {
			format: 'P2P_PAYMENT',
			simple_description: `${match.groups.service} Payment ${type === 'CR' ? 'from' : 'to'} ${match.groups.recipient.trim()}`,
			p2p_service: match.groups.service,
			p2p_recipient: match.groups.recipient.trim(),
			p2p_identifier: match.groups.identifier.trim(),
			p2p_transaction_id: match.groups.transaction_id.trim(),
			date: ddate(match.groups.date.trim()),
			p2p_type: type,
		}
	}
} as const;
export type DescriptionFormat = keyof typeof DescriptionFormats;

// console.log(TransactionUtils.extractDescriptionInfo("POINT OF SALE PURCHASE USA ID CHUBBUCK, MAVERIK #489 - 000000455113"));
// FUNDS TRANSFER FROM LINE OF CREDIT TO CHECKING
// MOBILE BANKING FUNDS TRANSFER TO LINE OF CREDIT
// MOBILE BANKING FUNDS TRANSFER FROM CHECKING
// POINT OF SALE FUNDS TRANSFER FROM LINE OF CREDIT TO CHECKING
// MOBILE BANKING PAYMENT FROM MONEY MARKET
