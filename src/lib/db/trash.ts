import { db } from './schema';
import { now } from './utils.svelte';
import { getSettings } from './queries/settings';

const DEFAULT_RETENTION_DAYS = 30;

const SOFT_DELETE_TABLES = [
	'users',
	'lists',
	'items',
	'activities',
	'activityLists',
	'attemptResults',
	'mediaAssets'
] as const;

type SoftDeleteTable = (typeof SOFT_DELETE_TABLES)[number];

/** Lazy purge, called once on app load: hard-deletes anything trashed past the retention window. */
export async function purgeExpiredTrash(retentionDays?: number): Promise<void> {
	const days = retentionDays ?? (await getSettings()).trashRetentionDays ?? DEFAULT_RETENTION_DAYS;
	const cutoff = now() - days * 86_400_000;
	const tables = SOFT_DELETE_TABLES.map((t) => db[t]);
	await db.transaction('rw', tables, async () => {
		for (const t of SOFT_DELETE_TABLES) {
			await db[t].where('deletedAt').between(1, cutoff, true, true).delete();
		}
	});
}

/** Hard-deletes everything currently trashed, regardless of age. */
export async function emptyTrash(): Promise<void> {
	const tables = SOFT_DELETE_TABLES.map((t) => db[t]);
	await db.transaction('rw', tables, async () => {
		for (const t of SOFT_DELETE_TABLES) {
			await db[t].where('deletedAt').above(0).delete();
		}
	});
}

export async function trashCounts(): Promise<Record<SoftDeleteTable, number>> {
	const counts = {} as Record<SoftDeleteTable, number>;
	for (const t of SOFT_DELETE_TABLES) {
		counts[t] = await db[t].where('deletedAt').above(0).count();
	}
	return counts;
}
