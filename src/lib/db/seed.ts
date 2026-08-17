import { db } from './schema';
import { newId, now } from './utils.svelte';
import { SEED_LISTS } from './seed-data';
import { getSettings, updateSettings } from './queries/settings';
import type { Item, ItemField, List, User } from './types';

const SEED_VERSION = 2;

/**
 * Runs each versioned seed step at most once, tracked via settings.seedVersion.
 * Steps also carry their own idempotency checks (seedKey / isGuest) so they're
 * safe to re-run and so an install that already passed a later version never
 * re-does earlier steps.
 */
export async function seedIfNeeded(): Promise<void> {
	const settings = await getSettings();
	if (settings.seedVersion >= SEED_VERSION) return;

	if (settings.seedVersion < 1) await seedDefaultLists();
	if (settings.seedVersion < 2) await ensureGuestUser();

	await updateSettings({ seedVersion: SEED_VERSION });
}

/**
 * The 4 starter lists (Letters, Numbers, Animals, Colors). Per-list seedKey
 * existence checks mean a future pack only inserts the new list, leaving user
 * edits to existing ones untouched.
 */
async function seedDefaultLists(): Promise<void> {
	await db.transaction('rw', db.lists, db.items, async () => {
		for (const seed of SEED_LISTS) {
			const exists = await db.lists.where('seedKey').equals(seed.seedKey).first();
			if (exists) continue;

			const listId = newId();
			const ts = now();
			const list: List = {
				id: listId,
				name: seed.name,
				description: seed.description,
				listType: seed.listType,
				seedKey: seed.seedKey,
				createdAt: ts,
				updatedAt: ts,
				deletedAt: 0
			};
			await db.lists.add(list);

			const items: Item[] = seed.items.map((itemSpec, index) => {
				const fields: ItemField[] = (itemSpec.fields ?? []).map(
					(f) =>
						({
							id: newId(),
							type: f.type,
							value: f.value,
							label: f.label
						}) as ItemField
				);
				return {
					id: newId(),
					listId,
					title: itemSpec.title,
					fields,
					order: index,
					createdAt: ts,
					updatedAt: ts,
					deletedAt: 0
				};
			});
			await db.items.bulkAdd(items);
		}
	});
}

/** The permanent default player used to play activities when no other user is available or selected. */
async function ensureGuestUser(): Promise<void> {
	const existing = await db.users.filter((u) => u.isGuest === true).first();
	if (existing) return;

	const ts = now();
	const guest: User = {
		id: newId(),
		name: 'Guest',
		isGuest: true,
		createdAt: ts,
		updatedAt: ts,
		deletedAt: 0
	};
	await db.users.add(guest);
}
