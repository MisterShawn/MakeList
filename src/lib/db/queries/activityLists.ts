import { db } from '../schema';
import { createEntity } from './_base';
import { now } from '../utils.svelte';
import type { List, Activity } from '../types';

/** The many-to-many surface between Activities and Lists. */
export async function linkListToActivity(activityId: string, listId: string, role?: string) {
	const existing = await db.activityLists
		.where('[activityId+listId]')
		.equals([activityId, listId])
		.first();
	if (existing) {
		const patch: { deletedAt?: number; role?: string } = {};
		if (existing.deletedAt !== 0) patch.deletedAt = 0;
		if (existing.role !== role) patch.role = role;
		if (Object.keys(patch).length > 0) {
			await db.activityLists.update(existing.id, { ...patch, updatedAt: now() });
		}
		return { ...existing, ...patch };
	}
	return createEntity(db.activityLists, { activityId, listId, role });
}

export async function unlinkListFromActivity(activityId: string, listId: string): Promise<void> {
	const existing = await db.activityLists
		.where('[activityId+listId]')
		.equals([activityId, listId])
		.first();
	if (existing) {
		await db.activityLists.update(existing.id, { deletedAt: now(), updatedAt: now() });
	}
}

export async function getListsForActivity(activityId: string): Promise<List[]> {
	const links = await db.activityLists
		.where('activityId')
		.equals(activityId)
		.and((l) => l.deletedAt === 0)
		.toArray();
	const lists = await Promise.all(links.map((l) => db.lists.get(l.listId)));
	return lists.filter((l): l is List => !!l && l.deletedAt === 0);
}

/** The list (if any) marked with role 'group' for this activity — see PollRunner's roster mode. */
export async function getGroupListForActivity(activityId: string): Promise<List | undefined> {
	const link = await db.activityLists
		.where('activityId')
		.equals(activityId)
		.and((l) => l.deletedAt === 0 && l.role === 'group')
		.first();
	if (!link) return undefined;
	const list = await db.lists.get(link.listId);
	return list && list.deletedAt === 0 ? list : undefined;
}

export async function getActivitiesForList(listId: string): Promise<Activity[]> {
	const links = await db.activityLists
		.where('listId')
		.equals(listId)
		.and((l) => l.deletedAt === 0)
		.toArray();
	const activities = await Promise.all(links.map((l) => db.activities.get(l.activityId)));
	return activities.filter((a): a is Activity => !!a && a.deletedAt === 0);
}
