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

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const asAny = <T>(value: T): any => {
	return value as any;
}

export const jsonCopy = <T>(value: T): T => {
	return JSON.parse(JSON.stringify(value));
}
