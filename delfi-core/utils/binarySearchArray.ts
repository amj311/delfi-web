export abstract class BinarySearchArray<T = any, K = any> {
	private array!: T[];

	constructor(items: T[] = []) {
		this.array = [...items];
	}

	public findByKey(searchKey: K): T | undefined {
		return this.binarySearch(searchKey).item;
	}

	public getRange(start: K, end: K, inclusive = false): T[] {
		// verify range is valid
		if (this.compareKeys(start, end) >= 0) throw new Error('Range start must be below end!');

		const lowSearch = this.binarySearch(start);
		let lowIndex = lowSearch.indexMatch;
		if (!lowSearch.indexMatch) {
			lowIndex = inclusive ? lowSearch.indexUnder : lowSearch.indexOver;
		}
		const highSearch = this.binarySearch(end, lowIndex); // tell search to start at low index
		let highIndex = highSearch.indexMatch;
		if (!highSearch.indexMatch) {
			highIndex = inclusive ? highSearch.indexOver : highSearch.indexUnder;
		}
		return this.array.slice(lowIndex, highIndex ? (highIndex + 1) : this.array.length + 1);
	}

	public add(item: T) {
		// compare to extremes to avoid binary if possible
		const lowCompare = this.compareKeys(this.getKey(item), this.getKey(this.array[0]));
		if (lowCompare < 0) {
			this.array.unshift(item);
			return;
		}

		const highCompare = this.compareKeys(this.getKey(item), this.getKey(this.array[this.array.length - 1]));
		if (highCompare > 0) {
			this.array.push(item);
			return;
		}

		// binary
		const insertSearch = this.binarySearch(this.getKey(item));
		if (insertSearch.indexMatch) throw new Error('Item with this key already exists. Duplicate keys are not supported.');
		this.array.splice(insertSearch.indexOver || 0, 0, item);
	}

	public remove(key: K) {
		const removeSearch = this.binarySearch(key);
		if (!removeSearch.indexMatch) return;
		this.array.splice(removeSearch.indexMatch, 1);
	}

	protected getKey(item: T): K {
		return item as unknown as K;
	};

	protected compareKeys(a: K, b: K): number {
		if (a === b) return 0;
		return a < b ? -1 : 1;
	}

	public binarySearch(
		searchKey: K,
		startingLow: number = 0,
		startingHigh: number = this.array.length - 1,
	): {
		item?: T,
		indexMatch?: number,
		indexUnder?: number,
		indexOver?: number
	} {
		if (startingLow > startingHigh) throw new Error('Low is greater than high');
		if (startingLow < 0) throw new Error('Low is less than 0');
		if (startingHigh >= this.array.length) throw new Error('High is greater than array length');

		let low = startingLow;
		let high = startingHigh;
		let currentIndex = 0;
		let isCurrentAbove = false;
		let isCurrentBelow = false;
		let index = -1;

		while (low <= high) {
			currentIndex = Math.floor((low + high) / 2);
			const comparison = this.compareKeys(this.getKey(this.array[currentIndex]), searchKey);
			if (comparison === 0) {
				index = currentIndex;
				isCurrentAbove = false;
				isCurrentBelow = false;
				break;
			}
			else if (comparison < 0) {
				low = currentIndex + 1;
				isCurrentAbove = false;
				isCurrentBelow = true;
			}
			else {
				high = currentIndex - 1;
				isCurrentAbove = true;
				isCurrentBelow = false;
			}
		}

		const item = this.array[index];
		const indexUnder = isCurrentBelow ? currentIndex : currentIndex - 1;
		const indexOver = isCurrentAbove ? currentIndex : currentIndex + 1;

		return {
			item,
			indexMatch: index >= 0 ? index : undefined,
			indexUnder: indexUnder >= 0 ? indexUnder : undefined,
			indexOver: indexOver < this.array.length ? indexOver : undefined,
		};
	}
}