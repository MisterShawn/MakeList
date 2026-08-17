import { createColumnHelper, renderComponent } from '@tanstack/svelte-table';
import type { DataTableFeatures } from '$lib/components/data-table/features.js';
import type { List } from '$lib/db/types';
import DataTableNameCell from './data-table-name-cell.svelte';
import DataTableSortButton from '$lib/components/data-table/sort-button.svelte';
import DataTableCountCell from './data-table-count-cell.svelte';
import DataTableTagsCell from './data-table-tags-cell.svelte';
import DataTableRowActions from './data-table-row-actions.svelte';

export type ListRow = List & { itemCount: number };

const columnHelper = createColumnHelper<DataTableFeatures, ListRow>();

export function createColumns(handlers: {
	onDelete: (list: ListRow) => void;
	onSaveTags: (list: ListRow, tags: string[]) => void;
	tagSuggestions?: string[];
}) {
	return columnHelper.columns([
		columnHelper.accessor('name', {
			header: ({ column }) =>
				renderComponent(DataTableSortButton, {
					label: 'Name',
					onSortToggle: column.getToggleSortingHandler()
				}),
			cell: ({ row }) =>
				renderComponent(DataTableNameCell, {
					name: row.original.name,
					description: row.original.description
				}),
			sortFn: 'text'
		}),
		columnHelper.accessor('itemCount', {
			header: 'Items',
			cell: ({ row }) => renderComponent(DataTableCountCell, { count: row.original.itemCount }),
			sortFn: 'alphanumeric'
		}),
		columnHelper.accessor('tags', {
			header: 'Tags',
			cell: ({ row }) =>
				renderComponent(DataTableTagsCell, {
					value: row.original.tags ?? [],
					suggestions: handlers.tagSuggestions,
					onSave: (tags: string[]) => handlers.onSaveTags(row.original, tags)
				})
		}),
		columnHelper.display({
			id: 'actions',
			cell: ({ row }) =>
				renderComponent(DataTableRowActions, { onDelete: () => handlers.onDelete(row.original) })
		})
	]);
}
