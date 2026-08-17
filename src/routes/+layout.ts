import { seedIfNeeded } from '$lib/db/seed';
import { purgeExpiredTrash } from '$lib/db/trash';

export const ssr = false;
export const prerender = false;

export async function load() {
	await seedIfNeeded();
	await purgeExpiredTrash();
	return {};
}
