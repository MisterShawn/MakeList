import { createColumnHelper, renderComponent } from '@tanstack/svelte-table';
import type { DataTableFeatures } from '$lib/components/data-table/features.js';
import type { Item, MediaRef } from '$lib/db/types';
import { readItemFields } from '$lib/activity-types';
import DataTableSortButton from '$lib/components/data-table/sort-button.svelte';
import DataTableTextCell from './data-table-text-cell.svelte';
import DataTableIconCell from './data-table-icon-cell.svelte';
import DataTableEmojiCell from './data-table-emoji-cell.svelte';
import DataTableMediaCell from './data-table-media-cell.svelte';
import DataTableColorCell from './data-table-color-cell.svelte';
import DataTableRowActions from './data-table-row-actions.svelte';

export type ItemFieldPatch = Partial<{
	title: string;
	text: string;
	icon: string | undefined;
	emoji: string | undefined;
	image: MediaRef | undefined;
	audio: MediaRef | undefined;
}>;

export type ItemColorPatch = Partial<{
	bgColor: string | undefined;
	textColor: string | undefined;
}>;

export type ItemRow = Item & {
	text: string;
	icon?: string;
	emoji?: string;
	image?: MediaRef;
	audio?: MediaRef;
};

export function toItemRow(item: Item): ItemRow {
	return { ...item, ...readItemFields(item) };
}

const columnHelper = createColumnHelper<DataTableFeatures, ItemRow>();

export function createColumns(handlers: {
	onSaveTitle: (item: ItemRow, title: string) => void;
	onSaveField: (item: ItemRow, patch: ItemFieldPatch) => void;
	onSaveColor: (item: ItemRow, patch: ItemColorPatch) => void;
	onEdit: (item: ItemRow) => void;
	onDelete: (item: ItemRow) => void;
}) {
	return columnHelper.columns([
		columnHelper.accessor('title', {
			header: ({ column }) =>
				renderComponent(DataTableSortButton, {
					label: 'Title',
					onSortToggle: column.getToggleSortingHandler()
				}),
			cell: ({ row }) =>
				renderComponent(DataTableTextCell, {
					value: row.original.title,
					validate: (v: string) => v.trim().length > 0,
					onSave: (v: string) => handlers.onSaveTitle(row.original, v),
					pillBg: row.original.bgColor,
					pillText: row.original.textColor
				}),
			sortFn: 'text'
		}),
		columnHelper.accessor('text', {
			header: 'Text',
			cell: ({ row }) =>
				renderComponent(DataTableTextCell, {
					value: row.original.text,
					onSave: (v: string) => handlers.onSaveField(row.original, { text: v })
				})
		}),
		columnHelper.accessor('icon', {
			header: 'Icon',
			cell: ({ row }) =>
				renderComponent(DataTableIconCell, {
					value: row.original.icon,
					onSave: (v?: string) => handlers.onSaveField(row.original, { icon: v })
				})
		}),
		columnHelper.accessor('emoji', {
			header: 'Emoji',
			cell: ({ row }) =>
				renderComponent(DataTableEmojiCell, {
					value: row.original.emoji,
					onSave: (v?: string) => handlers.onSaveField(row.original, { emoji: v })
				})
		}),
		columnHelper.accessor('image', {
			header: 'Image',
			cell: ({ row }) =>
				renderComponent(DataTableMediaCell, {
					value: row.original.image,
					kind: 'image',
					onSave: (v?: MediaRef) => handlers.onSaveField(row.original, { image: v })
				})
		}),
		columnHelper.accessor('audio', {
			header: 'Audio',
			cell: ({ row }) =>
				renderComponent(DataTableMediaCell, {
					value: row.original.audio,
					kind: 'audio',
					onSave: (v?: MediaRef) => handlers.onSaveField(row.original, { audio: v })
				})
		}),
		columnHelper.accessor('bgColor', {
			header: 'Color',
			cell: ({ row }) =>
				renderComponent(DataTableColorCell, {
					bg: row.original.bgColor,
					text: row.original.textColor,
					onSave: (patch: ItemColorPatch) => handlers.onSaveColor(row.original, patch)
				})
		}),
		columnHelper.display({
			id: 'actions',
			cell: ({ row }) =>
				renderComponent(DataTableRowActions, {
					onEdit: () => handlers.onEdit(row.original),
					onDelete: () => handlers.onDelete(row.original)
				})
		})
	]);
}
