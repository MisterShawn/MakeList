import { db } from '../schema';
import { createEntity, updateEntity, softDeleteEntity, restoreEntity, purgeEntity } from './_base';
import type { Item, BaseEntity, ItemFieldType } from '../types';

export async function listItemsForList(listId: string): Promise<Item[]> {
	return db.items
		.where('listId')
		.equals(listId)
		.and((i) => i.deletedAt === 0)
		.sortBy('order');
}

export async function listTrashedItemsForList(listId: string): Promise<Item[]> {
	return db.items
		.where('listId')
		.equals(listId)
		.and((i) => i.deletedAt > 0)
		.toArray();
}

export async function listAllTrashedItems(): Promise<Item[]> {
	return db.items.where('deletedAt').above(0).toArray();
}

export async function getItem(id: string): Promise<Item | undefined> {
	return db.items.get(id);
}

export async function createItem(
	listId: string,
	data: Omit<Item, keyof BaseEntity | 'listId'>
): Promise<Item> {
	return createEntity(db.items, { ...data, listId });
}

export async function updateItem(
	id: string,
	patch: Partial<Omit<Item, 'id' | 'createdAt' | 'listId'>>
): Promise<void> {
	return updateEntity(db.items, id, patch);
}

export async function softDeleteItem(id: string): Promise<void> {
	return softDeleteEntity(db.items, id);
}

export async function restoreItem(id: string): Promise<void> {
	return restoreEntity(db.items, id);
}

export async function purgeItem(id: string): Promise<void> {
	return purgeEntity(db.items, id);
}

/**
 * Distinct item-field types actually present across the given lists' active items, used
 * by ActivityForm's field pickers. Computed on read, never stored — keeps the
 * extensibility promise that new field types need no schema change. An item can have at
 * most one field of each type, so the type alone is enough to pick "the icon field" etc.
 */
export async function getDistinctFieldTypes(listIds: string[]): Promise<ItemFieldType[]> {
	const seen = new Set<ItemFieldType>();
	for (const listId of listIds) {
		const items = await listItemsForList(listId);
		for (const item of items) {
			for (const field of item.fields) seen.add(field.type);
		}
	}
	return [...seen];
}
