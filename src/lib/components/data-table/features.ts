import {
	columnVisibilityFeature,
	createPaginatedRowModel,
	createSortedRowModel,
	rowPaginationFeature,
	rowSortingFeature,
	sortFn_alphanumeric,
	sortFn_text,
	tableFeatures
} from '@tanstack/svelte-table';

export const features = tableFeatures({
	columnVisibilityFeature,
	rowSortingFeature,
	rowPaginationFeature,
	sortedRowModel: createSortedRowModel(),
	paginatedRowModel: createPaginatedRowModel(),
	sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text }
});

export type DataTableFeatures = typeof features;
