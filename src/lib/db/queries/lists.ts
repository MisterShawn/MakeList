import { db } from '../schema';
import { createEntity, updateEntity } from './_base';
import { now } from '../utils.svelte';
import type { List, BaseEntity } from '../types';

export async function listActiveLists(): Promise<List[]> {
	return db.lists.where('deletedAt').equals(0).sortBy('order');
}

export async function listTrashedLists(): Promise<List[]> {
	return db.lists.where('deletedAt').above(0).toArray();
}

export async function getList(id: string): Promise<List | undefined> {
	return db.lists.get(id);
}

export async function createList(data: Omit<List, keyof BaseEntity>): Promise<List> {
	return createEntity(db.lists, data);
}

export async function updateList(
	id: string,
	patch: Partial<Omit<List, 'id' | 'createdAt'>>
): Promise<void> {
	return updateEntity(db.lists, id, patch);
}

/** Soft-deletes the list and cascades to its active items, stamped with the same deletedAt. */
export async function softDeleteList(id: string): Promise<void> {
	const ts = now();
	await db.transaction('rw', db.lists, db.items, async () => {
		await db.lists.update(id, { deletedAt: ts, updatedAt: ts });
		const items = await db.items
			.where('listId')
			.equals(id)
			.and((i) => i.deletedAt === 0)
			.toArray();
		await Promise.all(items.map((i) => db.items.update(i.id, { deletedAt: ts, updatedAt: ts })));
	});
}

/** Restores the list and any items that were cascade-deleted alongside it (not items trashed independently earlier). */
export async function restoreList(id: string): Promise<void> {
	const list = await db.lists.get(id);
	if (!list) return;
	const cascadeTs = list.deletedAt;
	const ts = now();
	await db.transaction('rw', db.lists, db.items, async () => {
		await db.lists.update(id, { deletedAt: 0, updatedAt: ts });
		if (cascadeTs > 0) {
			const items = await db.items
				.where('listId')
				.equals(id)
				.and((i) => i.deletedAt === cascadeTs)
				.toArray();
			await Promise.all(items.map((i) => db.items.update(i.id, { deletedAt: 0, updatedAt: ts })));
		}
	});
}

export async function purgeList(id: string): Promise<void> {
	await db.transaction('rw', db.lists, db.items, async () => {
		await db.items.where('listId').equals(id).delete();
		await db.lists.delete(id);
	});
}
