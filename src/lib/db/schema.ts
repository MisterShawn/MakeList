import Dexie, { type EntityTable } from 'dexie';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface List {
	id?: number;
	name: string;
	description?: string;
	folderId?: number;
	tagIds: number[];
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface Item {
	id?: number;
	listId: number;
	text: string;
	subtext?: string;
	/** MediaAsset id for static image */
	mediaId?: number;
	/** MediaAsset id for animated GIF */
	gifId?: number;
	/** OpenMoji hex code e.g. "1F600" */
	emojiId?: string;
	/** MediaAsset id for audio */
	audioId?: number;
	/** OKLCH color string used as card background in boards */
	color?: string;
	position: number;
	tagIds: number[];
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export type BoardType =
	| 'flashcard'
	| 'multiple-choice'
	| 'matching'
	| 'memory'
	| 'quiz'
	| 'choice-board';

export interface Board {
	id?: number;
	name: string;
	type: BoardType;
	/** Primary list */
	listId: number;
	/** Secondary list — used by choice-board */
	list2Id?: number;
	/** Board-specific config (timer, try-again, etc.) */
	settings: Record<string, unknown>;
	folderId?: number;
	tagIds: number[];
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface Session {
	id?: number;
	boardId: number;
	playerId?: number;
	startedAt: Date;
	completedAt?: Date;
	score?: number;
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface SessionAnswer {
	id?: number;
	sessionId: number;
	itemId: number;
	correct: boolean;
	responseMs?: number;
	attempt: number;
	createdAt: Date;
}

export interface Tag {
	id?: number;
	name: string;
	color: string;
	deletedAt?: Date;
	createdAt: Date;
}

export type FolderScope = 'list' | 'board' | 'media' | 'player';

export interface Folder {
	id?: number;
	name: string;
	parentId?: number;
	scope: FolderScope;
	deletedAt?: Date;
	createdAt: Date;
}

export type MediaType = 'image' | 'gif' | 'audio';

export interface MediaAsset {
	id?: number;
	name: string;
	type: MediaType;
	/** base64 data URL */
	dataUrl: string;
	tagIds: number[];
	folderId?: number;
	deletedAt?: Date;
	createdAt: Date;
}

export interface Player {
	id?: number;
	name: string;
	/** OpenMoji hex code */
	avatarEmoji?: string;
	tagIds: number[];
	folderId?: number;
	/** True for built-in players (e.g. Guest) that cannot be deleted */
	isSystem?: boolean;
	deletedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

// ─── Database ─────────────────────────────────────────────────────────────────

export type MakeListDB = Dexie & {
	lists: EntityTable<List, 'id'>;
	items: EntityTable<Item, 'id'>;
	boards: EntityTable<Board, 'id'>;
	sessions: EntityTable<Session, 'id'>;
	sessionAnswers: EntityTable<SessionAnswer, 'id'>;
	tags: EntityTable<Tag, 'id'>;
	folders: EntityTable<Folder, 'id'>;
	mediaAssets: EntityTable<MediaAsset, 'id'>;
	players: EntityTable<Player, 'id'>;
};

export const db = new Dexie('makelist') as MakeListDB;

db.version(1).stores({
	lists: '++id, folderId, deletedAt, *tagIds',
	items: '++id, listId, position, deletedAt, *tagIds',
	boards: '++id, type, listId, list2Id, folderId, deletedAt, *tagIds',
	sessions: '++id, boardId, playerId, startedAt, completedAt, deletedAt',
	sessionAnswers: '++id, sessionId, itemId, correct, attempt',
	tags: '++id, name, deletedAt',
	folders: '++id, parentId, scope, deletedAt',
	mediaAssets: '++id, type, folderId, deletedAt, *tagIds',
	players: '++id, folderId, deletedAt, *tagIds'
});
