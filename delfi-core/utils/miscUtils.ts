export const peek = <T>(array: T[]): T | undefined => {
	return !array?.length ? undefined : array[array.length - 1];
}

/**
 * Function to retrieve a property from an object based on a dot-separated path.
 * @param obj - The object to retrieve the property from.
 * @param path - The dot-separated path to the property.
 * @returns The value of the property at the specified path, or undefined if not found.
 */
export const getPropertyByPath = (obj: Record<string, any>, path: string): any => {
	if (!obj || !path) return undefined;
	const properties = path.split('.');
	let current = obj;

	for (const prop of properties) {
		if (current && Object.prototype.hasOwnProperty.call(current, prop)) {
			current = current[prop];
		} else {
			return undefined; // Property not found
		}
	}

	return current;
}

/**
 * Function to set a property from an object based on a dot-separated path.
 * @param obj - The object to set the property on.
 * @param path - The dot-separated path to the property.
 * @param value - The value to set at the specified path.
 */
export const setPropertyByPath = (obj: Record<string, any>, path: string, value: any): void => {
	if (!obj || !path) return;
	const properties = path.split('.');
	const lastProperty = properties.pop();
	if (!lastProperty) return; // If no last property, do nothing

	let current = obj;
	for (const prop of properties) {
		if (!current[prop]) {
			return; // If any part of the path does not exist, do not set the value
		}
		current = current[prop];
	}

	current[lastProperty] = value;
}

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const asAny = <T>(value: T): any => {
	return value as any;
}

export const jsonCopy = <T>(value: T): T => {
	return JSON.parse(JSON.stringify(value)) as T;
}


export class PromiseQueue {
	private queue: Array<() => Promise<any>> = [];

	public add<T>(promiseFn: () => Promise<T>): Promise<T> {
		return new Promise((resolve, reject) => {
			this.queue.push(() => promiseFn().then(resolve).catch(reject));
			if (this.queue.length === 1) {
				this.processQueue();
			}
		});
	}

	private async processQueue() {
		while (this.queue.length > 0) {
			const next = this.queue[0];
			try {
				await next();
			} catch (error) {
				console.error('Error processing queue:', error);
			}
			this.queue.shift();
		}
	}
}

export const diff = (objA: any, objB: any, maxDepth: number = 10): any => {
	const changes: any = {};
	function populateChanges(a: any, b: any, path: string = '', depth: number = 0) {
		if (depth > maxDepth) return;
		if (!a) {
			changes[path + 'self'] = { path, old: undefined, new: b };
			return;
		}
		if (!b) {
			changes[path + 'self'] = { path, old: a, new: undefined };
			return;
		}

		for (const key in a) {
			const newPath = path ? `${path}.${key}` : key;
			if (!a[key] && !b[key]) {
				continue; // Ignore null to undefined changes
			}
			else if (typeof a[key] === 'object' && typeof b[key] === 'object') {
				// If both are arrays or objects, recurse into them
				populateChanges(a[key], b[key], path ? `${path}.${key}` : key, depth + 1);
			}
			else if (a[key] !== b[key]) {
				changes[newPath] = { old: a[key], new: b[key] };
			}
			
		}
		for (const key in b) {
			const newPath = path ? `${path}.${key}` : key;
			if (!(key in a)) {
				changes[newPath] = { old: undefined, new: b[key] };
			}
		}
	}
	populateChanges(objA, objB);
	return Object.keys(changes).length > 0 ? changes : null;
}

export const nullOrUndefined = (value: any): boolean => {
	return value === null || value === undefined;
}

export const coalesce = <T>(...values: (T | null | undefined)[]): T => {
	for (const value of values) {
		if (value !== null && value !== undefined) {
			return value;
		}
	}
	throw new Error('All values are null or undefined');
}

export const currency = (value: number = 0, currencyCode: string = 'USD', locale: string = 'en-US'): string => {
	return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode }).format(value);
}

export const parseNumber = (src: any) => {
	if (typeof src === 'number') {
		return src;
	}
	// Remove all non-number chars. ie $2,300.75 -> 2300.75
	const modified = String(src)?.split(/[^\d\.-]/g).join('');
	return parseFloat(modified);
}