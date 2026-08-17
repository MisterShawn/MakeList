import type { EntityTable } from 'dexie';
import { newId, now, stripProxy } from '../utils.svelte';
import type { BaseEntity } from '../types';

export async function createEntity<T extends BaseEntity>(
	table: EntityTable<T, 'id'>,
	data: Omit<T, keyof BaseEntity>
): Promise<T> {
	const entity = {
		...stripProxy(data),
		id: newId(),
		createdAt: now(),
		updatedAt: now(),
		deletedAt: 0
	} as T;
	await table.add(entity);
	return entity;
}

export async function updateEntity<T extends BaseEntity>(
	table: EntityTable<T, 'id'>,
	id: string,
	patch: Partial<Omit<T, 'id' | 'createdAt'>>
): Promise<void> {
	// Dexie's IDType<T, 'id'> doesn't reduce for an abstract T even when constrained
	// to BaseEntity (id: string) — every table's primary key is genuinely a string.
	await table.update(id as never, { ...stripProxy(patch), updatedAt: now() } as never);
}

export async function softDeleteEntity<T extends BaseEntity>(
	table: EntityTable<T, 'id'>,
	id: string
): Promise<void> {
	await table.update(id as never, { deletedAt: now(), updatedAt: now() } as never);
}

export async function restoreEntity<T extends BaseEntity>(
	table: EntityTable<T, 'id'>,
	id: string
): Promise<void> {
	await table.update(id as never, { deletedAt: 0, updatedAt: now() } as never);
}

export async function purgeEntity<T extends BaseEntity>(
	table: EntityTable<T, 'id'>,
	id: string
): Promise<void> {
	await table.delete(id as never);
}
