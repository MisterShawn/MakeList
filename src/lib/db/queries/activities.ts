import { db } from '../schema';
import { createEntity, updateEntity } from './_base';
import { now } from '../utils.svelte';
import type { Activity, BaseEntity } from '../types';

export async function listActiveActivities(): Promise<Activity[]> {
	return db.activities.where('deletedAt').equals(0).sortBy('order');
}

export async function listTrashedActivities(): Promise<Activity[]> {
	return db.activities.where('deletedAt').above(0).toArray();
}

export async function getActivity(id: string): Promise<Activity | undefined> {
	return db.activities.get(id);
}

export async function createActivity(data: Omit<Activity, keyof BaseEntity>): Promise<Activity> {
	return createEntity(db.activities, data);
}

export async function updateActivity(
	id: string,
	patch: Partial<Omit<Activity, 'id' | 'createdAt'>>
): Promise<void> {
	return updateEntity(db.activities, id, patch);
}

/** Soft-deletes the activity and cascades to its active list-links. */
export async function softDeleteActivity(id: string): Promise<void> {
	const ts = now();
	await db.transaction('rw', db.activities, db.activityLists, async () => {
		await db.activities.update(id, { deletedAt: ts, updatedAt: ts });
		const links = await db.activityLists
			.where('activityId')
			.equals(id)
			.and((l) => l.deletedAt === 0)
			.toArray();
		await Promise.all(
			links.map((l) => db.activityLists.update(l.id, { deletedAt: ts, updatedAt: ts }))
		);
	});
}

/** Restores the activity and any list-links cascade-deleted alongside it. */
export async function restoreActivity(id: string): Promise<void> {
	const activity = await db.activities.get(id);
	if (!activity) return;
	const cascadeTs = activity.deletedAt;
	const ts = now();
	await db.transaction('rw', db.activities, db.activityLists, async () => {
		await db.activities.update(id, { deletedAt: 0, updatedAt: ts });
		if (cascadeTs > 0) {
			const links = await db.activityLists
				.where('activityId')
				.equals(id)
				.and((l) => l.deletedAt === cascadeTs)
				.toArray();
			await Promise.all(
				links.map((l) => db.activityLists.update(l.id, { deletedAt: 0, updatedAt: ts }))
			);
		}
	});
}

export async function purgeActivity(id: string): Promise<void> {
	await db.transaction('rw', db.activities, db.activityLists, db.attemptResults, async () => {
		await db.activityLists.where('activityId').equals(id).delete();
		await db.attemptResults.where('activityId').equals(id).delete();
		await db.activities.delete(id);
	});
}
