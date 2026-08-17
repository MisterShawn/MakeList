import type { Item, ItemField, FieldSelector } from './db/types';

/**
 * Resolves a field selector to a displayable field for an item. An item has at most one
 * field of each type, so the type itself is enough to find it; 'title' resolves to a
 * synthetic text field wrapping Item.title. Falls back to title if the item has no field
 * of the requested type (e.g. it was added on a different list, or after this item).
 */
export function resolveFieldForType(item: Item, fieldType: FieldSelector): ItemField {
	const titleFallback: ItemField = { id: `${item.id}-title`, type: 'text', value: item.title };
	if (fieldType === 'title') return titleFallback;
	return item.fields.find((f) => f.type === fieldType) ?? titleFallback;
}

/**
 * True when `field` is the title (or the title-fallback resolveFieldForType substitutes
 * for a missing field type) — the only slot an item's assigned bg/text color applies to,
 * since colorizing an arbitrary icon/image/audio field wouldn't make sense.
 */
export function isTitleField(item: Item, field: ItemField): boolean {
	return field.id === `${item.id}-title`;
}

export function shuffle<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}
