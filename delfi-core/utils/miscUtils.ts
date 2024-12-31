export const peek = <T>(array: T[]): T | undefined => {
	return !array?.length ? undefined : array[array.length - 1];
}