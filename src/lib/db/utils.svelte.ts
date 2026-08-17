export const newId = () => crypto.randomUUID();
export const now = () => Date.now();

/**
 * Svelte 5 $state objects are Proxies — the browser's structuredClone (and thus
 * Dexie/IndexedDB's write path) can throw DataCloneError on them directly. Run any
 * component-sourced object through this before an add/put/update. $state.snapshot
 * (not raw structuredClone) since it unwraps proxies while leaving foreign values
 * like Blob untouched by reference, rather than trying to clone them itself.
 */
export function stripProxy<T>(value: T): T {
	return typeof value === 'object' && value !== null ? ($state.snapshot(value) as T) : value;
}
