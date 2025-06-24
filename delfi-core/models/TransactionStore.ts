import { type MatchingRule, type TransactionFilter } from "../services/FilterService";
import type { BudgetEvent } from "./Budget";

type IndexKey = string | number | 'undefined';
export const indexableProperties = [
	'year',
	'month',
	'day',
	'category_id',
	'type',
	'account_id',
	'target_account_partition_id',
] as const;
export type IndexableProperty = typeof indexableProperties[number];

type IndexConfig = {
	queryProp: IndexableProperty,
	// canCompare?: boolean,
	// leaveRuleWhenFinished?: boolean, // rules are removed from the filter when complete to allow early returns, unless this is true
	// getMatchingRuleKeys?: (filter: TransactionFilter[number]) => IndexKey[],
	// getTransactionKey?: (transaction: TransactionEvent) => IndexKey,
}
const indices: IndexConfig[] = [
	// Assume that MOST transactions will have at least one occurrence per month.
	// Is it better to lookup the date first or last?
	// YEAR
	{ queryProp: 'year' },
	// MONTH
	{ queryProp: 'month' },
	// DAY
	{ queryProp: 'day' },
	{ queryProp: 'category_id' },
	{ queryProp: 'account_id' },
	{ queryProp: 'target_account_partition_id' },
	{ queryProp: 'type' },
] as const;

type IndexMatchingRule = MatchingRule & {
	property: IndexableProperty,
}
export type IndexFilter = Array<IndexMatchingRule>;

/**
 * A tree of nested indices to quickly find transactions by several properties.
 */
export class TransactionStore {
	protected rootIndex!: IndexNode;

	constructor(props: any = {}) {
		const indicesToUse: IndexConfig[] = props.indices || indices;

		function createNestedIndex(idx: number) {
			const config = indicesToUse[idx];
			const createNextLayer = (idx < indicesToUse.length - 1
				? () => createNestedIndex(idx + 1)
				: undefined
			);
			const layer = new IndexLayerNode(config, createNextLayer);
			return layer;
		}

		this.rootIndex = createNestedIndex(0);
	}

	public async addTransaction(transaction: BudgetEvent) {
		this.rootIndex.addTransaction(transaction);
		// ust wait a second to free up the event loop for UI
		await new Promise(resolve => setTimeout(resolve, 1));
	}

	public async addTransactions(transactions: BudgetEvent[]) {
		// console.time('TransactionStore.addTransactions');
		// console.timeLog('TransactionStore.addTransactions');
		await Promise.all(transactions.map(t => this.addTransaction(t)));
		// console.timeEnd('TransactionStore.addTransactions');
	}

	public deleteTransaction(transaction: BudgetEvent) {
		this.rootIndex.deleteTransaction(transaction);
	}

	public deleteTransactions(transactions: BudgetEvent[]) {
		transactions.forEach(t => this.rootIndex.deleteTransaction(t));
	}

	public filter(filter: IndexFilter) {
		return this.rootIndex.query(filter.slice());
	}

	public accumulation(filter: IndexFilter) {
		return this.rootIndex.accumulation(filter.slice());
	}
}

abstract class IndexNode {
	protected acc = 0;

	protected onAddTransaction(transaction: BudgetEvent) {
		this.acc += transaction.amount;
	}
	protected onDeleteTransaction(transaction: BudgetEvent) {
		this.acc -= transaction.amount;
	}

	public abstract addTransaction(transaction: BudgetEvent);
	public abstract query(filter: IndexFilter): BudgetEvent[];
	public abstract deleteTransaction(transaction: BudgetEvent): boolean;
	public abstract accumulation(filter: IndexFilter): number;
}

class IndexLayerNode<C extends IndexConfig = IndexConfig> extends IndexNode {
	private index: Record<any, IndexNode> = {};

	constructor(
		private config: C,
		private createNextLayer?: () => IndexNode, // IndexNode constructor
	) {
		super(); 
	};

	private get queryProp() {
		return this.config.queryProp;
	}

	private getOrCreateEntry(key: IndexKey) {
		if (!this.index[key]) {
			if (this.createNextLayer) {
				this.index[key] = this.createNextLayer();
			}
			else {
				this.index[key] = new IndexLeafNode();
			}
		}
		return this.index[key];
	}

	/**
	 * 
	 * @param filter A 'key' is the indexed value of the transaction for the `queryProp`
	 * @returns 
	 */
	private getFilterKeys(filter: TransactionFilter): IndexKey[] {
		// find the matching rule of the filter that applies to this index
		const rule = filter.find(r => r.property === this.queryProp);
		if (!rule || rule.operator === '*' || !rule.operand) {
			return Object.keys(this.index); // indicates no filter for this index, so all children be visited
		}
		// Remove the rule from the filter so we know when all filters are done
		filter.filter(r => r.property !== this.queryProp);
		// // TODO: handle comparisons by returning only the matching keys
		// // For now, assume equality
		// if (this.config.getMatchingRuleKeys) {
		// 	return this.config.getMatchingRuleKeys(rule);
		// }
		return Array.isArray(rule.operand) ? rule.operand : [rule.operand];
	}

	/**
	 * Handle arrays by assuming that every transaction may have multiple values on which to index the same prop
	 */
	private getTransactionKey(transaction: BudgetEvent) {
		// if (this.config.getTransactionKey) {
		// 	return this.config.getTransactionKey(transaction);
		// }
		return transaction[this.queryProp] || 'undefined';
	}


	public addTransaction(transaction: BudgetEvent) {
		const key = this.getTransactionKey(transaction);
		const layer = this.getOrCreateEntry(key) as IndexNode;
		layer.addTransaction(transaction);

		this.onAddTransaction(transaction);
	}


	public query(filter: IndexFilter): BudgetEvent[] {
		const queriedKeys = this.getFilterKeys(filter);
		const layers = queriedKeys.map(key => this.index[key]);
		return layers.flatMap(layer => layer?.query(filter) || []);
	}

	public deleteTransaction(transaction: BudgetEvent): boolean {
		const key = this.getTransactionKey(transaction);
		const didDelete = this.index[key]?.deleteTransaction(transaction);
		if (didDelete) {
			super.onDeleteTransaction(transaction);
		}
		return didDelete || false;
	}

	// each node contains the accumulation of all transactions in its subtree
	// So to get the accumulation of a filter, we need to find the lowest node that matches the filter, but no lower
	public accumulation(filter: IndexFilter): number {
		if (filter.length === 0) {
			// This must be the lowest node so just return full accumulation
			return this.acc;
		}
		const queriedKeys = this.getFilterKeys(filter);
		const layers = queriedKeys.map(key => this.index[key]).filter(Boolean);
		return layers.reduce((acc, layer) => acc + layer.accumulation(filter), 0);
	}
}

class IndexLeafNode extends IndexNode {
	private transactions: BudgetEvent[] = [];

	public addTransaction(transaction: BudgetEvent) {
		this.transactions.push(transaction);
		super.onAddTransaction(transaction);
	}

	public query() {
		return this.transactions;
	}

	public deleteTransaction(transaction: BudgetEvent) {
		const foundIndex = this.transactions.findIndex(t => t.id === transaction.id);
		if (foundIndex === -1) {
			return false; // Transaction not found
		}
		this.transactions.splice(foundIndex, 1);
		super.onDeleteTransaction(transaction);
		return true;
	}

	public accumulation() {
		return this.acc;
	}
}

export const GlobalTransactionStore = new TransactionStore();
