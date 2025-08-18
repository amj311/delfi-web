type DebounceOptions = {
	beforeDebounce?: (...args: any[]) => any,
	doFirst?: boolean,
	allowInterval?: boolean,
}
export default function debounce(action: (...args: any[]) => void, wait: number, options: DebounceOptions = {}) {
	let activeTimeout: ReturnType<typeof setTimeout> | null = null;
	let lastFinish = 0;

	return (...args: any[]) => {
		let ignore;
		let cancel;
	
		if (options.beforeDebounce) {
			const flags = options.beforeDebounce(...args) || {};
			({cancel, ignore} = flags);
		}

		// If ignore, don't reset the debounce
		if (ignore) {
			return;
		}

		if (cancel) {
			clearTimeout(activeTimeout || 0);
			return;
		}

		// Reset wait time if not doing interval
		if (activeTimeout && !options.allowInterval) {
			clearTimeout(activeTimeout);
		}
		// Do first if it has been a while since the last debounce
		if (options.doFirst && !activeTimeout && Date.now() - lastFinish > wait) {
			action(...args);
		}

		// Set timeout if there is not currently one
		// if not doing interval, reset the wait time, otherwise let it continue
		if (!activeTimeout || !options.allowInterval) {
			activeTimeout = setTimeout(() => {
				action(...args);
				activeTimeout = null;
				lastFinish = Date.now();
			}, wait);
		}
	};
}
