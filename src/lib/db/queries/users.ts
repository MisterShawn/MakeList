import { db } from '../schema';
import { createEntity, updateEntity, softDeleteEntity, restoreEntity, purgeEntity } from './_base';
import type { User, BaseEntity } from '../types';

export async function listActiveUsers(): Promise<User[]> {
	return db.users.where('deletedAt').equals(0).sortBy('order');
}

export async function listTrashedUsers(): Promise<User[]> {
	return db.users.where('deletedAt').above(0).toArray();
}

export async function getUser(id: string): Promise<User | undefined> {
	return db.users.get(id);
}

export async function createUser(data: Omit<User, keyof BaseEntity>): Promise<User> {
	return createEntity(db.users, data);
}

export async function updateUser(
	id: string,
	patch: Partial<Omit<User, 'id' | 'createdAt'>>
): Promise<void> {
	return updateEntity(db.users, id, patch);
}

export async function softDeleteUser(id: string): Promise<void> {
	const user = await db.users.get(id);
	if (user?.isGuest) throw new Error('The Guest user cannot be deleted.');
	return softDeleteEntity(db.users, id);
}

export async function restoreUser(id: string): Promise<void> {
	return restoreEntity(db.users, id);
}

export async function purgeUser(id: string): Promise<void> {
	const user = await db.users.get(id);
	if (user?.isGuest) throw new Error('The Guest user cannot be deleted.');
	return purgeEntity(db.users, id);
}
