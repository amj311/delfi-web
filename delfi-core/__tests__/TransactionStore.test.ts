
import { TransactionStore } from '../models/TransactionStore';
import { beforeEach, describe, expect, test } from 'vitest'

const testIndices = [
	{ queryProp: 'key1', },
	{ queryProp: 'key2', },
	{ queryProp: 'key3', },
];

class MockTransactionStore extends TransactionStore {
	getIndex() {
		return this.rootIndex;
	}
}

describe(TransactionStore, () => {
	let transactionStore!: MockTransactionStore;
	beforeEach(() => {
		transactionStore = new MockTransactionStore({ indices: testIndices });
	})

	describe('addTransaction', () => {
		test('creates all layers and keys for first transaction', () => {
			expect(transactionStore.getIndex()).toMatchObject({});
			const testTransaction = {
				key1: 'one',
				key2: 'two',
				key3: 'three'
			} as any;
			transactionStore.addTransaction(testTransaction);
			expect(transactionStore.getIndex()).toMatchObject(expect.objectContaining({
				// layer 1
				index: {
					'one': expect.objectContaining({
						// layer 2
						index: {
							'two': expect.objectContaining({
								// layer 3
								index: {
									'three': expect.objectContaining({
										transactions: expect.arrayContaining([testTransaction]),
									}),
								},
							}),
						},
					}),
				},
			}));
		});

		test('creates `undefined` layer when property does not exist', () => {
			expect(transactionStore.getIndex()).toMatchObject({});
			const testTransaction = {
				key1: 'one',
				key3: 'three'
			} as any;
			// Make sure it can add to the "undefined" index as well
			const testTransaction2 = {
				key1: 'one',
				key3: 'three',
				numberTwo: true,
			} as any;
			transactionStore.addTransaction(testTransaction);
			transactionStore.addTransaction(testTransaction2);
			expect(transactionStore.getIndex()).toMatchObject(expect.objectContaining({
				// layer 1
				index: {
					'one': expect.objectContaining({
						// layer 2
						index: {
							['undefined']: expect.objectContaining({
								// layer 3
								index: {
									'three': expect.objectContaining({
										transactions: expect.arrayContaining([testTransaction, testTransaction2]),
									}),
								},
							}),
						},
					}),
				},
			}));
		})


		test('deletes existing transaction', () => {
			expect(transactionStore.getIndex()).toMatchObject({});
			const testTransaction = {
				key1: 'one',
				key3: 'three',
				id: 'number1'
			} as any;
			const testTransaction2 = {
				key1: 'one',
				key3: 'three',
				id: 'number2',
			} as any;
			transactionStore.addTransactions([testTransaction, testTransaction2]);
			transactionStore.deleteTransaction(testTransaction);
			expect(transactionStore.getIndex()).toMatchObject(expect.objectContaining({
				// layer 1
				index: {
					'one': expect.objectContaining({
						// layer 2
						index: {
							['undefined']: expect.objectContaining({
								// layer 3
								index:{
									'three': expect.objectContaining({
										transactions: expect.arrayContaining([testTransaction2]),
									}),
								},
							}),
						},
					}),
				},
			}));
		})


		test('queries transaction with unique property', () => {
			expect(transactionStore.getIndex()).toMatchObject({});
			const testTransaction = {
				key1: 'same',
			} as any;
			const testTransaction2 = {
				key1: 'not same',
			} as any;
			transactionStore.addTransactions([testTransaction, testTransaction2]);
			const filter = [{
				property: 'key1' as any,
				operator: 'eq' as any,
				operand: 'same',
			}]
			expect(transactionStore.filter(filter)).toMatchSnapshot([
				testTransaction
			]);
		})

		test('queries transactions with shared property', () => {
			expect(transactionStore.getIndex()).toMatchObject({});
			const testTransaction = {
				key1: 'same',
			} as any;
			const testTransaction2 = {
				key1: 'same',
			} as any;
			transactionStore.addTransactions([testTransaction, testTransaction2]);
			const filter = [{
				property: 'key1' as any,
				operator: 'eq' as any,
				operand: 'same',
			}]
			expect(transactionStore.filter(filter)).toMatchSnapshot([
				testTransaction, testTransaction2
			]);
		})

		test('queries deep when layer key is not in query', () => {
			expect(transactionStore.getIndex()).toMatchObject({});
			const testTransaction = {
				key1: 'shallow',
			} as any;
			const testTransaction2 = {
				key3: 'deep',
			} as any;
			transactionStore.addTransactions([testTransaction, testTransaction2]);
			const filter = [{
				property: 'key3' as any,
				operator: 'eq' as any,
				operand: 'deep',
			}]
			expect(transactionStore.filter(filter)).toMatchSnapshot([
				testTransaction2
			]);
		})

		test('queries matches from different branches', () => {
			expect(transactionStore.getIndex()).toMatchObject({});
			const testTransaction = {
				key1: 'branch1',
				key2: 'branch3',
				key3: 'same',
			} as any;
			const testTransaction2 = {
				key1: 'branch2',
				key2: 'branch4',
				key3: 'same',
			} as any;
			transactionStore.addTransactions([testTransaction, testTransaction2]);
			const filter = [{
				property: 'key3' as any,
				operator: 'eq' as any,
				operand: 'same',
			}]
			expect(transactionStore.filter(filter)).toMatchSnapshot([
				testTransaction, testTransaction2
			]);
		})

		test('returns empty array for no matches', () => {
			expect(transactionStore.getIndex()).toMatchObject({});
			const testTransaction = {
				key1: 'branch1',
				key2: 'branch3',
				key3: 'same',
			} as any;
			transactionStore.addTransactions([testTransaction]);
			const filter = [{
				property: 'key3' as any,
				operator: 'eq' as any,
				operand: 'other',
			}]
			expect(transactionStore.filter(filter)).toMatchSnapshot([]);
		})

		test('accumulates on each layer', () => {
			expect(transactionStore.getIndex()).toMatchObject({});
			const testTransaction = {
				key1: 'shallow',
				amount: 100,
			} as any;
			const testTransaction2 = {
				key2: 'deep',
				amount: 50,
			} as any;
			const testTransaction3 = {
				key3: 'deeper',
				key2: 'deep', // let this be accumulated at level 2 'deep'
				amount: 25,
			} as any;
			transactionStore.addTransactions([testTransaction, testTransaction2, testTransaction3]);
			
			// This filtered acc should not include any transactions where key1 was NOT 'shallow'
			const filter = [{
				property: 'key1' as any,
				operator: 'eq' as any,
				operand: 'shallow',
			}]
			expect(transactionStore.accumulation(filter)).toBe(100);
			
			// should count ALL where key2 === deep
			const filter2 = [{
				property: 'key2' as any,
				operator: 'eq' as any,
				operand: 'deep',
			}]
			expect(transactionStore.accumulation(filter2)).toBe(75);
			const filter3 = [{
				property: 'key3' as any,
				operator: 'eq' as any,
				operand: 'deeper',
			}]
			expect(transactionStore.accumulation(filter3)).toBe(25);

			// Empty filter should return ALL
			expect(transactionStore.accumulation([])).toBe(175);
			// * filter should return all beneath
			const filter4 = [{
				property: 'key1' as any,
				operator: '*' as any,
			}]
			expect(transactionStore.accumulation(filter4)).toBe(175);

			// deleting should decrement at all levels
			transactionStore.deleteTransaction(testTransaction3);
			expect(transactionStore.accumulation(filter4)).toBe(150);
			expect(transactionStore.accumulation(filter2)).toBe(50);
			expect(transactionStore.accumulation(filter3)).toBe(0);
		})
	})
})
