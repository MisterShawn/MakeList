import { db } from '../schema';
import { now } from '../utils.svelte';
import type { AppSettings } from '../types';

const DEFAULT_TRASH_RETENTION_DAYS = 30;

export async function getSettings(): Promise<AppSettings> {
	const existing = await db.settings.get('app');
	if (existing) return existing;
	const defaults: AppSettings = {
		id: 'app',
		seedVersion: 0,
		trashRetentionDays: DEFAULT_TRASH_RETENTION_DAYS,
		updatedAt: now()
	};
	await db.settings.add(defaults);
	return defaults;
}

export async function updateSettings(patch: Partial<Omit<AppSettings, 'id'>>): Promise<void> {
	await getSettings();
	await db.settings.update('app', { ...patch, updatedAt: now() });
}
