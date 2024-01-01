export const peek = <T>(array: T[]): T | undefined => {
	return array[array.length - 1];
}