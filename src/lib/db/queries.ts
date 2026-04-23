/**
 * All database access lives here. Never import `db` directly in components.
 * Always strip Svelte 5 proxies before writes: JSON.parse(JSON.stringify(value))
 */
import { db } from './schema';
import type {
	Board,
	Folder,
	FolderScope,
	Item,
	List,
	MediaAsset,
	Player,
	Session,
	SessionAnswer,
	Tag
} from './schema';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deproxy<T>(value: T): T {
	return JSON.parse(JSON.stringify(value));
}

function now() {
	return new Date();
}

// Dexie infers key type as number|undefined because id is optional in entity interfaces.
// The cast is safe: auto-increment always produces a number on insert.
async function add<T>(table: { add(item: T): Promise<number | undefined> }, item: T): Promise<number> {
	return (await table.add(item)) as number;
}

// ─── Global search ────────────────────────────────────────────────────────────

export type SearchResultType = 'list' | 'item' | 'board' | 'player' | 'tag' | 'media' | 'trash';

export type SearchResult = {
	id: number;
	name: string;
	type: SearchResultType;
	href: string;
	breadcrumb?: string;
};

const TRASH_LABEL: Record<string, string> = {
	list: 'List', item: 'Item', board: 'Board', player: 'Player', tag: 'Tag', media: 'Media',
};

export async function searchAll(query: string): Promise<SearchResult[]> {
	const q = query.trim().toLowerCase();
	if (!q) return [];

	const [lists, allLists, matchedItems, boards, players, tags, media,
		trashLists, trashItems, trashBoards, trashPlayers, trashTags, trashMedia] = await Promise.all([
		db.lists.filter((l) => !l.deletedAt && l.name.toLowerCase().includes(q)).toArray(),
		db.lists.filter((l) => !l.deletedAt).toArray(),
		db.items.filter((i) => !i.deletedAt && i.text.toLowerCase().includes(q)).toArray(),
		db.boards.filter((b) => !b.deletedAt && b.name.toLowerCase().includes(q)).toArray(),
		db.players.filter((p) => !p.deletedAt && p.name.toLowerCase().includes(q)).toArray(),
		db.tags.filter((t) => !t.deletedAt && t.name.toLowerCase().includes(q)).toArray(),
		db.mediaAssets.filter((m) => !m.deletedAt && m.name.toLowerCase().includes(q)).toArray(),
		db.lists.filter((l) => !!l.deletedAt && l.name.toLowerCase().includes(q)).toArray(),
		db.items.filter((i) => !!i.deletedAt && i.text.toLowerCase().includes(q)).toArray(),
		db.boards.filter((b) => !!b.deletedAt && b.name.toLowerCase().includes(q)).toArray(),
		db.players.filter((p) => !!p.deletedAt && p.name.toLowerCase().includes(q)).toArray(),
		db.tags.filter((t) => !!t.deletedAt && t.name.toLowerCase().includes(q)).toArray(),
		db.mediaAssets.filter((m) => !!m.deletedAt && m.name.toLowerCase().includes(q)).toArray(),
	]);

	const listNameById = new Map(allLists.map((l) => [l.id!, l.name]));

	const trashResults: SearchResult[] = [
		...trashLists.map((l) => ({ id: l.id!, name: l.name, type: 'trash' as const, href: '/trash', breadcrumb: TRASH_LABEL.list })),
		...trashItems.map((i) => ({ id: i.id!, name: i.text, type: 'trash' as const, href: '/trash', breadcrumb: TRASH_LABEL.item })),
		...trashBoards.map((b) => ({ id: b.id!, name: b.name, type: 'trash' as const, href: '/trash', breadcrumb: TRASH_LABEL.board })),
		...trashPlayers.map((p) => ({ id: p.id!, name: p.name, type: 'trash' as const, href: '/trash', breadcrumb: TRASH_LABEL.player })),
		...trashTags.map((t) => ({ id: t.id!, name: t.name, type: 'trash' as const, href: '/trash', breadcrumb: TRASH_LABEL.tag })),
		...trashMedia.map((m) => ({ id: m.id!, name: m.name, type: 'trash' as const, href: '/trash', breadcrumb: TRASH_LABEL.media })),
	];

	return [
		...lists.map((l) => ({ id: l.id!, name: l.name, type: 'list' as const, href: `/lists/${l.id}` })),
		...matchedItems.map((i) => ({
			id: i.id!,
			name: i.text,
			type: 'item' as const,
			href: `/lists/${i.listId}`,
			breadcrumb: listNameById.get(i.listId),
		})),
		...boards.map((b) => ({ id: b.id!, name: b.name, type: 'board' as const, href: `/boards/${b.id}` })),
		...players.map((p) => ({ id: p.id!, name: p.name, type: 'player' as const, href: `/players` })),
		...tags.map((t) => ({ id: t.id!, name: t.name, type: 'tag' as const, href: `/tags` })),
		...media.map((m) => ({ id: m.id!, name: m.name, type: 'media' as const, href: `/media` })),
		...trashResults,
	];
}

// ─── Lists ────────────────────────────────────────────────────────────────────

export async function createList(data: Omit<List, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
	const ts = now();
	return add(db.lists, deproxy({ ...data, createdAt: ts, updatedAt: ts }));
}

export async function getNavCounts() {
	const [lists, boards, players, sessions, tags, media, trash] = await Promise.all([
		db.lists.filter((l) => !l.deletedAt).count(),
		db.boards.filter((b) => !b.deletedAt).count(),
		db.players.filter((p) => !p.deletedAt).count(),
		db.sessions.filter((s) => !s.deletedAt).count(),
		db.tags.filter((t) => !t.deletedAt).count(),
		db.mediaAssets.filter((m) => !m.deletedAt).count(),
		Promise.all([
			db.lists.filter((l) => !!l.deletedAt).count(),
			db.items.filter((i) => !!i.deletedAt).count(),
			db.boards.filter((b) => !!b.deletedAt).count(),
			db.sessions.filter((s) => !!s.deletedAt).count(),
			db.players.filter((p) => !!p.deletedAt).count(),
			db.mediaAssets.filter((m) => !!m.deletedAt).count(),
			db.tags.filter((t) => !!t.deletedAt).count(),
		]).then((counts) => counts.reduce((a, b) => a + b, 0))
	]);
	return { lists, boards, players, sessions, tags, media, trash };
}

export async function getLists(includeDeleted = false): Promise<List[]> {
	const all = await db.lists.toArray();
	return includeDeleted ? all : all.filter((l) => !l.deletedAt);
}

export async function getList(id: number): Promise<List | undefined> {
	return db.lists.get(id);
}

export async function updateList(id: number, data: Partial<Omit<List, 'id' | 'createdAt'>>): Promise<void> {
	await db.lists.update(id, deproxy({ ...data, updatedAt: now() }));
}

export async function softDeleteList(id: number): Promise<void> {
	await db.lists.update(id, { deletedAt: now(), updatedAt: now() });
}

export async function restoreList(id: number): Promise<void> {
	await db.lists.update(id, { deletedAt: undefined, updatedAt: now() });
}

export async function purgeList(id: number): Promise<void> {
	await db.transaction('rw', [db.lists, db.items], async () => {
		await db.items.where('listId').equals(id).delete();
		await db.lists.delete(id);
	});
}

// ─── Items ────────────────────────────────────────────────────────────────────

export async function createItem(data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
	const ts = now();
	return add(db.items, deproxy({ ...data, createdAt: ts, updatedAt: ts }));
}

export async function getItems(listId: number, includeDeleted = false): Promise<Item[]> {
	const items = await db.items.where('listId').equals(listId).sortBy('position');
	return includeDeleted ? items : items.filter((i) => !i.deletedAt);
}

export async function getItem(id: number): Promise<Item | undefined> {
	return db.items.get(id);
}

export async function updateItem(id: number, data: Partial<Omit<Item, 'id' | 'createdAt'>>): Promise<void> {
	// deproxy strips undefined values (JSON.stringify drops them), so we can't use
	// db.items.update() to clear optional fields. Use modify() instead, which lets
	// us delete properties directly from the stored record.
	const plain = deproxy({ ...data, updatedAt: now() });
	await db.items.where(':id').equals(id).modify((record) => {
		Object.assign(record, plain);
		for (const key of Object.keys(data) as (keyof typeof data)[]) {
			if (data[key] === undefined) delete (record as unknown as Record<string, unknown>)[key];
		}
	});
}

export async function softDeleteItem(id: number): Promise<void> {
	await db.items.update(id, { deletedAt: now(), updatedAt: now() });
}

export async function restoreItem(id: number): Promise<void> {
	await db.items.update(id, { deletedAt: undefined, updatedAt: now() });
}

export async function purgeItem(id: number): Promise<void> {
	await db.items.delete(id);
}

export async function reorderItems(listId: number, orderedIds: number[]): Promise<void> {
	await db.transaction('rw', [db.items], async () => {
		for (let i = 0; i < orderedIds.length; i++) {
			await db.items.update(orderedIds[i], { position: i, updatedAt: now() });
		}
	});
}

export async function getNextItemPosition(listId: number): Promise<number> {
	const items = await db.items.where('listId').equals(listId).toArray();
	if (items.length === 0) return 0;
	return Math.max(...items.map((i) => i.position)) + 1;
}

// ─── Boards ───────────────────────────────────────────────────────────────────

export async function createBoard(data: Omit<Board, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
	const ts = now();
	return add(db.boards, deproxy({ ...data, createdAt: ts, updatedAt: ts }));
}

export async function getBoards(includeDeleted = false): Promise<Board[]> {
	const all = await db.boards.toArray();
	return includeDeleted ? all : all.filter((b) => !b.deletedAt);
}

export async function getBoard(id: number): Promise<Board | undefined> {
	return db.boards.get(id);
}

export async function updateBoard(id: number, data: Partial<Omit<Board, 'id' | 'createdAt'>>): Promise<void> {
	await db.boards.update(id, deproxy({ ...data, updatedAt: now() }));
}

export async function softDeleteBoard(id: number): Promise<void> {
	await db.boards.update(id, { deletedAt: now(), updatedAt: now() });
}

export async function restoreBoard(id: number): Promise<void> {
	await db.boards.update(id, { deletedAt: undefined, updatedAt: now() });
}

export async function purgeBoard(id: number): Promise<void> {
	await db.boards.delete(id);
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function createSession(data: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
	const ts = now();
	return add(db.sessions, deproxy({ ...data, createdAt: ts, updatedAt: ts }));
}

export async function getSessions(boardId?: number): Promise<Session[]> {
	if (boardId !== undefined) {
		return db.sessions.where('boardId').equals(boardId).toArray();
	}
	return db.sessions.toArray();
}

export async function getSession(id: number): Promise<Session | undefined> {
	return db.sessions.get(id);
}

export async function updateSession(id: number, data: Partial<Omit<Session, 'id' | 'createdAt'>>): Promise<void> {
	await db.sessions.update(id, deproxy({ ...data, updatedAt: now() }));
}

export async function addSessionAnswer(data: Omit<SessionAnswer, 'id' | 'createdAt'>): Promise<number> {
	return add(db.sessionAnswers, deproxy({ ...data, createdAt: now() }));
}

export async function getSessionAnswers(sessionId: number): Promise<SessionAnswer[]> {
	return db.sessionAnswers.where('sessionId').equals(sessionId).toArray();
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

export async function createTag(data: Omit<Tag, 'id' | 'createdAt'>): Promise<number> {
	return add(db.tags, deproxy({ ...data, createdAt: now() }));
}

export async function getTags(includeDeleted = false): Promise<Tag[]> {
	const all = await db.tags.toArray();
	return includeDeleted ? all : all.filter((t) => !t.deletedAt);
}

export async function getTag(id: number): Promise<Tag | undefined> {
	return db.tags.get(id);
}

export async function updateTag(id: number, data: Partial<Omit<Tag, 'id' | 'createdAt'>>): Promise<void> {
	await db.tags.update(id, deproxy(data));
}

export async function softDeleteTag(id: number): Promise<void> {
	await db.tags.update(id, { deletedAt: now() });
}

export async function restoreTag(id: number): Promise<void> {
	await db.tags.update(id, { deletedAt: undefined });
}

export async function purgeTag(id: number): Promise<void> {
	await db.tags.delete(id);
}

export async function getContentByTag(tagId: number): Promise<{
	lists: List[];
	items: Item[];
	itemListMap: Map<number, List>;
	boards: Board[];
}> {
	const [lists, items, boards] = await Promise.all([
		db.lists.where('tagIds').equals(tagId).filter((l) => !l.deletedAt).toArray(),
		db.items.where('tagIds').equals(tagId).filter((i) => !i.deletedAt).toArray(),
		db.boards.where('tagIds').equals(tagId).filter((b) => !b.deletedAt).toArray(),
	]);
	const listIds = [...new Set(items.map((i) => i.listId))];
	const parentLists = await Promise.all(listIds.map((id) => db.lists.get(id)));
	const itemListMap = new Map(
		parentLists.filter(Boolean).map((l) => [l!.id!, l!] as [number, List]),
	);
	return { lists, items, itemListMap, boards };
}

// ─── Folders ──────────────────────────────────────────────────────────────────

export async function createFolder(data: Omit<Folder, 'id' | 'createdAt'>): Promise<number> {
	return add(db.folders, deproxy({ ...data, createdAt: now() }));
}

export async function getFolders(scope?: FolderScope, includeDeleted = false): Promise<Folder[]> {
	let all: Folder[];
	if (scope) {
		all = await db.folders.where('scope').equals(scope).toArray();
	} else {
		all = await db.folders.toArray();
	}
	return includeDeleted ? all : all.filter((f) => !f.deletedAt);
}

export async function getFolder(id: number): Promise<Folder | undefined> {
	return db.folders.get(id);
}

export async function updateFolder(id: number, data: Partial<Omit<Folder, 'id' | 'createdAt'>>): Promise<void> {
	await db.folders.update(id, deproxy(data));
}

export async function softDeleteFolder(id: number): Promise<void> {
	await db.folders.update(id, { deletedAt: now() });
}

export async function purgeFolder(id: number): Promise<void> {
	await db.folders.delete(id);
}

// ─── Media Assets ─────────────────────────────────────────────────────────────

export async function createMediaAsset(data: Omit<MediaAsset, 'id' | 'createdAt'>): Promise<number> {
	return add(db.mediaAssets, deproxy({ ...data, createdAt: now() }));
}

export async function getMediaAssets(includeDeleted = false): Promise<MediaAsset[]> {
	const all = await db.mediaAssets.toArray();
	return includeDeleted ? all : all.filter((m) => !m.deletedAt);
}

export async function getMediaAsset(id: number): Promise<MediaAsset | undefined> {
	return db.mediaAssets.get(id);
}

export async function updateMediaAsset(id: number, data: Partial<Omit<MediaAsset, 'id' | 'createdAt'>>): Promise<void> {
	await db.mediaAssets.update(id, deproxy(data));
}

export async function softDeleteMediaAsset(id: number): Promise<void> {
	await db.mediaAssets.update(id, { deletedAt: now() });
}

export async function restoreMediaAsset(id: number): Promise<void> {
	await db.mediaAssets.update(id, { deletedAt: undefined });
}

export async function purgeMediaAsset(id: number): Promise<void> {
	await db.mediaAssets.delete(id);
}

// ─── Players ──────────────────────────────────────────────────────────────────

export async function createPlayer(data: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
	const ts = now();
	return add(db.players, deproxy({ ...data, createdAt: ts, updatedAt: ts }));
}

/** Creates the Guest system player if one doesn't already exist. */
export async function ensureGuestPlayer(): Promise<void> {
	const existing = await db.players.filter((p) => !!p.isSystem).first();
	if (!existing) {
		const ts = now();
		await db.players.add({ name: 'Guest', avatarEmoji: '1F464', isSystem: true, tagIds: [], createdAt: ts, updatedAt: ts });
	}
}

export async function getPlayers(includeDeleted = false): Promise<Player[]> {
	const all = await db.players.toArray();
	const filtered = includeDeleted ? all : all.filter((p) => !p.deletedAt);
	return filtered.sort((a, b) => (b.isSystem ? 1 : 0) - (a.isSystem ? 1 : 0));
}

export async function getPlayer(id: number): Promise<Player | undefined> {
	return db.players.get(id);
}

export async function updatePlayer(id: number, data: Partial<Omit<Player, 'id' | 'createdAt'>>): Promise<void> {
	await db.players.update(id, deproxy({ ...data, updatedAt: now() }));
}

export async function softDeletePlayer(id: number): Promise<void> {
	await db.players.update(id, { deletedAt: now(), updatedAt: now() });
}

export async function restorePlayer(id: number): Promise<void> {
	await db.players.update(id, { deletedAt: undefined, updatedAt: now() });
}

export async function purgePlayer(id: number): Promise<void> {
	await db.players.delete(id);
}

// ─── Trash ────────────────────────────────────────────────────────────────────

export async function getTrash() {
	const [lists, items, boards, sessions, players, mediaAssets, tags] = await Promise.all([
		db.lists.filter((l) => !!l.deletedAt).toArray(),
		db.items.filter((i) => !!i.deletedAt).toArray(),
		db.boards.filter((b) => !!b.deletedAt).toArray(),
		db.sessions.filter((s) => !!s.deletedAt).toArray(),
		db.players.filter((p) => !!p.deletedAt).toArray(),
		db.mediaAssets.filter((m) => !!m.deletedAt).toArray(),
		db.tags.filter((t) => !!t.deletedAt).toArray()
	]);
	return { lists, items, boards, sessions, players, mediaAssets, tags };
}

export async function emptyTrash(): Promise<void> {
	await db.transaction('rw', [db.lists, db.items, db.boards, db.sessions, db.players, db.mediaAssets, db.tags], async () => {
		await Promise.all([
			db.lists.filter((l) => !!l.deletedAt).delete(),
			db.items.filter((i) => !!i.deletedAt).delete(),
			db.boards.filter((b) => !!b.deletedAt).delete(),
			db.sessions.filter((s) => !!s.deletedAt).delete(),
			db.players.filter((p) => !!p.deletedAt).delete(),
			db.mediaAssets.filter((m) => !!m.deletedAt).delete(),
			db.tags.filter((t) => !!t.deletedAt).delete()
		]);
	});
}

// ─── Export / Import ─────────────────────────────────────────────────────────

export async function exportAll() {
	const [lists, items, boards, sessions, sessionAnswers, tags, folders, mediaAssets, players] =
		await Promise.all([
			db.lists.toArray(),
			db.items.toArray(),
			db.boards.toArray(),
			db.sessions.toArray(),
			db.sessionAnswers.toArray(),
			db.tags.toArray(),
			db.folders.toArray(),
			db.mediaAssets.toArray(),
			db.players.toArray()
		]);
	return {
		version: 1,
		exportedAt: new Date().toISOString(),
		lists,
		items,
		boards,
		sessions,
		sessionAnswers,
		tags,
		folders,
		mediaAssets,
		players
	};
}

export async function clearAllData(): Promise<void> {
	const tables = [
		db.lists, db.items, db.boards, db.sessions,
		db.sessionAnswers, db.tags, db.folders, db.mediaAssets, db.players
	];
	await db.transaction('rw', tables, async () => {
		await Promise.all(tables.map((t) => t.clear()));
	});
}
