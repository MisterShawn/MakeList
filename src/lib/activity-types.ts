import type {
	ActivityType,
	ActivityConfig,
	Item,
	ItemField,
	ItemFieldType,
	FieldSelector,
	MediaRef
} from './db/types';
import { newId } from './db/utils.svelte';

/** Choosable types when adding/changing an item field — 'media' is legacy-only (see ALL_ITEM_FIELD_TYPE_LABELS). */
export const ITEM_FIELD_TYPE_OPTIONS: { value: ItemFieldType; label: string }[] = [
	{ value: 'text', label: 'Text' },
	{ value: 'icon', label: 'Icon' },
	{ value: 'emoji', label: 'Emoji' },
	{ value: 'image', label: 'Image' },
	{ value: 'audio', label: 'Audio' }
];

/** Superset of ITEM_FIELD_TYPE_OPTIONS so old items' legacy unified 'media' fields still label correctly. */
const ALL_ITEM_FIELD_TYPE_LABELS: Record<ItemFieldType, string> = {
	text: 'Text',
	icon: 'Icon',
	emoji: 'Emoji',
	image: 'Image',
	audio: 'Audio',
	media: 'Media'
};

export function itemFieldTypeLabel(type: ItemFieldType): string {
	return ALL_ITEM_FIELD_TYPE_LABELS[type] ?? type;
}

export function fieldSelectorLabel(selector: FieldSelector): string {
	return selector === 'title' ? 'Title' : itemFieldTypeLabel(selector);
}

/** An image/audio field is only "filled in" once it points at a real uploaded/imported
 *  asset — MediaFieldPicker always produces asset-backed values, but a legacy field
 *  loaded from old data could still be a bare unresolved URL. */
export function hasMediaRefContent(value: MediaRef | undefined): boolean {
	return value?.source === 'asset' || (value?.source === 'url' && value.url.trim().length > 0);
}

/**
 * Builds an item's `fields` array from the 5 fixed field-type slots shown in
 * ItemFieldsEditor — an item allows at most one field per type (so one image AND one
 * audio field, independently), meaning there's no separate add/remove step, just
 * whichever of these 5 values are non-empty. Reuses each type's existing field id so
 * saving an otherwise-untouched item doesn't churn ids.
 */
export function buildItemFields(
	values: { text: string; icon?: string; emoji?: string; image?: MediaRef; audio?: MediaRef },
	existing: ItemField[] = []
): ItemField[] {
	const idFor = (type: ItemFieldType) => existing.find((f) => f.type === type)?.id ?? newId();

	const fields: ItemField[] = [];
	const text = values.text.trim();
	if (text) fields.push({ id: idFor('text'), type: 'text', value: text });
	if (values.icon) fields.push({ id: idFor('icon'), type: 'icon', value: values.icon });
	if (values.emoji) fields.push({ id: idFor('emoji'), type: 'emoji', value: values.emoji });
	if (hasMediaRefContent(values.image)) {
		fields.push({ id: idFor('image'), type: 'image', value: values.image! });
	}
	if (hasMediaRefContent(values.audio)) {
		fields.push({ id: idFor('audio'), type: 'audio', value: values.audio! });
	}
	return fields;
}

/**
 * Reads an item's 5 fixed field-type slots for ItemFieldsEditor. Doesn't attempt to
 * migrate an old unified 'media' field into the image/audio slots — which kind it holds
 * can only be known by looking up its MediaAsset, and no current data actually has one
 * (the unified type predates any real usage) — so it's simply left as-is until re-picked.
 */
export function readItemFields(item: Item): {
	text: string;
	icon?: string;
	emoji?: string;
	image?: MediaRef;
	audio?: MediaRef;
} {
	return {
		text: item.fields.find((f) => f.type === 'text')?.value ?? '',
		icon: item.fields.find((f) => f.type === 'icon')?.value,
		emoji: item.fields.find((f) => f.type === 'emoji')?.value,
		image: item.fields.find((f) => f.type === 'image')?.value,
		audio: item.fields.find((f) => f.type === 'audio')?.value
	};
}

export const ACTIVITY_TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
	{ value: 'flashcards', label: 'Flash Cards' },
	{ value: 'multipleChoice', label: 'Multiple Choice' },
	{ value: 'matching', label: 'Matching' },
	{ value: 'memory', label: 'Memory' },
	{ value: 'quiz', label: 'Quiz' },
	{ value: 'poll', label: 'Poll' }
];

export function activityTypeLabel(type: ActivityType): string {
	return ACTIVITY_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

export function defaultConfigForType(type: ActivityType): ActivityConfig {
	switch (type) {
		case 'flashcards':
			return { type, frontFieldKey: 'title', backFieldKey: 'title' };
		case 'multipleChoice':
			return { type, promptFieldKey: 'title', answerFieldKey: 'title' };
		case 'matching':
			return { type, leftFieldKey: 'title', rightFieldKey: 'title' };
		case 'memory':
			return { type, fieldKeyA: 'title' };
		case 'quiz':
			return { type, promptFieldKey: 'title', answerFieldKey: 'title' };
		case 'poll':
			return { type, promptFieldKey: 'title' };
	}
}
