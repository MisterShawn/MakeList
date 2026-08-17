import { db } from '../schema';
import type { TagColor } from '../types';

export async function getTagColor(tag: string): Promise<TagColor | undefined> {
	return db.tagColors.get(tag);
}

/** Every assigned tag color, keyed by tag — one query for callers (e.g. TagBadges) that
 *  need to color a whole batch of tags at once rather than one lookup per tag. */
export async function getAllTagColors(): Promise<Record<string, TagColor>> {
	const rows = await db.tagColors.toArray();
	return Object.fromEntries(rows.map((row) => [row.tag, row]));
}

/** Upserts a tag's color, or removes the row entirely once both bg/text are cleared —
 *  keeps the table free of dead "no color" entries. */
export async function setTagColor(
	tag: string,
	patch: { bgColor?: string; textColor?: string }
): Promise<void> {
	if (!patch.bgColor && !patch.textColor) {
		await db.tagColors.delete(tag);
		return;
	}
	await db.tagColors.put({ tag, ...patch });
}
