import Dexie, { type EntityTable } from 'dexie';
import type {
	User,
	List,
	Item,
	Activity,
	ActivityList,
	AttemptResult,
	MediaAsset,
	AppSettings,
	TagColor
} from './types';

export class MakelistDB extends Dexie {
	users!: EntityTable<User, 'id'>;
	lists!: EntityTable<List, 'id'>;
	items!: EntityTable<Item, 'id'>;
	activities!: EntityTable<Activity, 'id'>;
	activityLists!: EntityTable<ActivityList, 'id'>;
	attemptResults!: EntityTable<AttemptResult, 'id'>;
	mediaAssets!: EntityTable<MediaAsset, 'id'>;
	settings!: EntityTable<AppSettings, 'id'>;
	tagColors!: EntityTable<TagColor, 'tag'>;

	constructor() {
		super('makelist');

		// v1: baseline schema. Only props that need to be queried/sorted/filtered are
		// indexed here — fields[]/config/detail stay as unindexed JSON blobs, so new
		// item field types, activity types, or attempt-detail shapes never require a
		// new .version() call, only a new table or a new *indexed* prop does.
		this.version(1).stores({
			users: 'id, deletedAt, order',
			lists: 'id, name, listType, seedKey, deletedAt, order',
			items: 'id, listId, deletedAt, order',
			activities: 'id, name, type, deletedAt, order',
			activityLists: 'id, activityId, listId, [activityId+listId], deletedAt',
			attemptResults: 'id, activityId, userId, type, deletedAt, completedAt, [activityId+userId]',
			mediaAssets: 'id, kind, deletedAt',
			settings: 'id'
		});

		// v2: adds a multi-entry `*tags` index to the three taggable tables (tags itself
		// stays an unindexed string[] the rest of the time — this index only exists so a
		// tag's detail page can look up "everything tagged X" without a full table scan).
		this.version(2).stores({
			lists: 'id, name, listType, seedKey, deletedAt, order, *tags',
			activities: 'id, name, type, deletedAt, order, *tags',
			mediaAssets: 'id, kind, deletedAt, *tags'
		});

		// v3: per-tag color assignments, keyed directly by the tag string (no BaseEntity —
		// tags aren't independently created/trashed, a color row is just harmlessly
		// orphaned once nothing carries that tag anymore).
		this.version(3).stores({
			tagColors: 'tag'
		});
	}
}

export const db = new MakelistDB();
