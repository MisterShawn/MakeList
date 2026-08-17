export interface BaseEntity {
	id: string;
	createdAt: number;
	updatedAt: number;
	/** 0 = active, epoch-ms = trashed at that time */
	deletedAt: number;
	order?: number;
}

// ---------- Users ----------
export interface User extends BaseEntity {
	name: string;
	avatarIcon?: string;
	avatarEmoji?: string;
	color?: string;
	/** The permanent default player used when no other user is available or selected. Cannot be deleted. */
	isGuest?: boolean;
}

// ---------- Media ----------
export interface MediaAsset extends BaseEntity {
	kind: 'image' | 'audio';
	sourceType: 'blob' | 'url';
	blob?: Blob;
	url?: string;
	mimeType?: string;
	fileName?: string;
	size?: number;
	tags?: string[];
}

export type MediaRef = { source: 'asset'; assetId: string } | { source: 'url'; url: string };

// ---------- Item fields (the extensible part) ----------
export type ItemFieldType = 'text' | 'icon' | 'emoji' | 'image' | 'audio' | 'media';

/** An item can have at most one field of each type, so a field type doubles as its own
 *  stable selector — used by ActivityConfig to say "the text field" rather than needing
 *  a separate per-field key. 'title' is a synthetic selector for Item.title itself. */
export type FieldSelector = 'title' | ItemFieldType;

interface FieldBase {
	/** stable identity for {#each} keying and editing */
	id: string;
	label?: string;
}

export interface TextField extends FieldBase {
	type: 'text';
	value: string;
}
export interface IconField extends FieldBase {
	type: 'icon';
	/** lucide icon name */
	value: string;
}
export interface EmojiField extends FieldBase {
	type: 'emoji';
	/** unicode character */
	value: string;
}
export interface ImageField extends FieldBase {
	type: 'image';
	value: MediaRef;
}
export interface AudioField extends FieldBase {
	type: 'audio';
	value: MediaRef;
}
/** Legacy unified image-or-audio field (kind came from whichever MediaAsset was picked,
 *  not the field itself) — kept only so old data still reads/renders correctly. Items now
 *  use separate ImageField/AudioField, one of each at most, rather than a shared slot. */
export interface MediaField extends FieldBase {
	type: 'media';
	value: MediaRef;
}

export type ItemField = TextField | IconField | EmojiField | ImageField | AudioField | MediaField;

export interface Item extends BaseEntity {
	listId: string;
	title: string;
	fields: ItemField[];
	/** Full Tailwind class, e.g. "bg-red-500" — set via ColorPicker. Governs how the
	 *  item's title renders (table cell, detail page, activity runners). */
	bgColor?: string;
	/** Full Tailwind class, e.g. "text-red-500" — set via ColorPicker. */
	textColor?: string;
}

// ---------- Tags ----------
/** A tag's assigned color — tags aren't their own entity (they're just strings inside
 *  List/Activity/MediaAsset's `tags[]`), so this is keyed directly by the tag string
 *  rather than extending BaseEntity. */
export interface TagColor {
	tag: string;
	/** Full Tailwind class, e.g. "bg-red-500" — set via ColorPicker. */
	bgColor?: string;
	/** Full Tailwind class, e.g. "text-red-500" — set via ColorPicker. */
	textColor?: string;
}

// ---------- Lists ----------
export interface List extends BaseEntity {
	name: string;
	description?: string;
	listType: 'generic' | string;
	icon?: string;
	color?: string;
	tags?: string[];
	/** idempotency marker for first-run seed data, absent on user-created lists */
	seedKey?: string;
}

// ---------- Activities ----------
export type ActivityType =
	'flashcards' | 'multipleChoice' | 'matching' | 'memory' | 'quiz' | 'poll';

export interface FlashcardsConfig {
	type: 'flashcards';
	frontFieldKey: FieldSelector;
	backFieldKey: FieldSelector;
	shuffle?: boolean;
}
export interface MultipleChoiceConfig {
	type: 'multipleChoice';
	promptFieldKey: FieldSelector;
	answerFieldKey: FieldSelector;
	choiceCount?: number;
	shuffle?: boolean;
}
export interface MatchingConfig {
	type: 'matching';
	leftFieldKey: FieldSelector;
	rightFieldKey: FieldSelector;
	pairsPerRound?: number;
}
export interface MemoryConfig {
	type: 'memory';
	fieldKeyA: FieldSelector;
	fieldKeyB?: FieldSelector;
	gridPairs?: number;
}
export interface QuizConfig {
	type: 'quiz';
	promptFieldKey: FieldSelector;
	answerFieldKey: FieldSelector;
	questionCount?: number;
	timedSeconds?: number;
}
export interface PollConfig {
	type: 'poll';
	promptFieldKey: FieldSelector;
	allowMultiple?: boolean;
	/** Field used to display each group member's name on the roster screen. Defaults to 'title'. */
	groupFieldKey?: FieldSelector;
}

export type ActivityConfig =
	FlashcardsConfig | MultipleChoiceConfig | MatchingConfig | MemoryConfig | QuizConfig | PollConfig;

export interface Activity extends BaseEntity {
	name: string;
	description?: string;
	type: ActivityType;
	config: ActivityConfig;
	tags?: string[];
}

/** many-to-many join between Activity and List */
export interface ActivityList extends BaseEntity {
	activityId: string;
	listId: string;
	role?: string;
}

// ---------- Attempts (generic results model) ----------
export interface FlashcardsDetail {
	type: 'flashcards';
	entries: { itemId: string; knewIt: boolean; timeMs?: number }[];
}
export interface MultipleChoiceDetail {
	type: 'multipleChoice';
	entries: { itemId: string; selectedItemId?: string; correct: boolean; timeMs?: number }[];
}
export interface MatchingDetail {
	type: 'matching';
	entries: { leftItemId: string; rightItemId: string; correct: boolean; timeMs?: number }[];
}
export interface MemoryDetail {
	type: 'memory';
	moves: number;
	matchedPairs: number;
	timeMs?: number;
}
export interface QuizDetail {
	type: 'quiz';
	entries: { itemId: string; selectedItemId?: string; correct: boolean; timeMs?: number }[];
	totalTimeMs?: number;
}
export interface PollDetail {
	type: 'poll';
	entries: { itemId: string; votes: number }[];
	/** Present when a group list was used: each group member's chosen option(s). */
	voterEntries?: { voterItemId: string; choiceItemIds: string[] }[];
}

export type AttemptDetail =
	FlashcardsDetail | MultipleChoiceDetail | MatchingDetail | MemoryDetail | QuizDetail | PollDetail;

export interface AttemptResult extends BaseEntity {
	activityId: string;
	userId: string;
	type: ActivityType;
	score: number;
	total: number;
	startedAt: number;
	completedAt?: number;
	detail: AttemptDetail;
}

export interface AppSettings {
	id: 'app';
	seedVersion: number;
	trashRetentionDays: number;
	currentUserId?: string;
	updatedAt: number;
}
