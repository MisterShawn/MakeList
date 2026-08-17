import { db } from '../schema';
import type { List, Activity, MediaAsset } from '../types';

/** Distinct tags across every taggable table, active records only, alphabetical — feeds TagsInput autocomplete. */
export async function listAllTags(): Promise<string[]> {
	const [lists, activities, mediaAssets] = await Promise.all([
		db.lists.where('deletedAt').equals(0).toArray(),
		db.activities.where('deletedAt').equals(0).toArray(),
		db.mediaAssets.where('deletedAt').equals(0).toArray()
	]);
	const tags = new Set<string>();
	for (const entity of [...lists, ...activities, ...mediaAssets]) {
		for (const tag of entity.tags ?? []) tags.add(tag);
	}
	return [...tags].sort((a, b) => a.localeCompare(b));
}

export interface TagSummary {
	tag: string;
	listCount: number;
	activityCount: number;
	mediaCount: number;
}

/** Every distinct tag with a per-table breakdown of how many active things carry it —
 *  powers the tags index page. */
export async function listTagsWithCounts(): Promise<TagSummary[]> {
	const tags = await listAllTags();
	return Promise.all(
		tags.map(async (tag) => {
			const { lists, activities, media } = await getTaggedEntities(tag);
			return {
				tag,
				listCount: lists.length,
				activityCount: activities.length,
				mediaCount: media.length
			};
		})
	);
}

/** Everything active tagged with `tag`, across all three taggable tables — powers the tag detail page. */
export async function getTaggedEntities(
	tag: string
): Promise<{ lists: List[]; activities: Activity[]; media: MediaAsset[] }> {
	const [lists, activities, media] = await Promise.all([
		db.lists
			.where('tags')
			.equals(tag)
			.and((l) => l.deletedAt === 0)
			.toArray(),
		db.activities
			.where('tags')
			.equals(tag)
			.and((a) => a.deletedAt === 0)
			.toArray(),
		db.mediaAssets
			.where('tags')
			.equals(tag)
			.and((m) => m.deletedAt === 0)
			.toArray()
	]);
	return { lists, activities, media };
}
