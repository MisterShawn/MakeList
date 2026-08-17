<script lang="ts" generics="TData extends RowData">
	import { type ColumnDef, type RowData, createTable, FlexRender } from '@tanstack/svelte-table';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { features, type DataTableFeatures } from './features.js';

	const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
	// Effectively "no pagination" — every row fits on a single page — when `paginated` is false.
	const UNPAGINATED_SIZE = 1_000_000;

	let {
		data,
		columns,
		onRowClick,
		emptyMessage = 'No results.',
		paginated = false
	}: {
		data: TData[];
		columns: ColumnDef<DataTableFeatures, TData>[];
		onRowClick?: (row: TData) => void;
		emptyMessage?: string;
		/** Enables the built-in Show N / Previous / Next controls, sorted-then-paginated. */
		paginated?: boolean;
	} = $props();

	const table = createTable({
		features,
		get data() {
			return data;
		},
		get columns() {
			return columns;
		},
		initialState: {
			pagination: { pageIndex: 0, pageSize: paginated ? 25 : UNPAGINATED_SIZE }
		}
	});
</script>

<div class="space-y-3">
	<div class="overflow-hidden rounded-2xl border">
		<Table.Root>
			<Table.Header>
				{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
					<Table.Row class="hover:bg-transparent">
						{#each headerGroup.headers as header (header.id)}
							<Table.Head>
								{#if !header.isPlaceholder}
									<FlexRender {header} />
								{/if}
							</Table.Head>
						{/each}
					</Table.Row>
				{/each}
			</Table.Header>
			<Table.Body>
				{#each table.getRowModel().rows as row (row.id)}
					<Table.Row
						class={onRowClick ? 'cursor-pointer' : ''}
						onclick={() => onRowClick?.(row.original)}
					>
						{#each row.getVisibleCells() as cell (cell.id)}
							<Table.Cell>
								<FlexRender {cell} />
							</Table.Cell>
						{/each}
					</Table.Row>
				{:else}
					<Table.Row class="hover:bg-transparent">
						<Table.Cell colspan={columns.length} class="h-24 text-center text-muted-foreground">
							{emptyMessage}
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
	{#if paginated && data.length > 0}
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-1.5 text-sm text-muted-foreground">
				Show
				<Select.Root
					type="single"
					value={String(table.atoms.pagination.get().pageSize)}
					onValueChange={(v) => v && table.setPageSize(Number(v))}
				>
					<Select.Trigger class="w-20">{table.atoms.pagination.get().pageSize}</Select.Trigger>
					<Select.Content>
						{#each PAGE_SIZE_OPTIONS as size (size)}
							<Select.Item value={String(size)} label={String(size)} />
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<div class="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					onclick={() => table.previousPage()}
					disabled={!table.getCanPreviousPage()}
					class="gap-1.5"
				>
					<ChevronLeftIcon class="size-4" />
					Previous
				</Button>
				<p class="text-sm text-muted-foreground">
					Page {table.atoms.pagination.get().pageIndex + 1} of {Math.max(1, table.getPageCount())}
				</p>
				<Button
					variant="outline"
					size="sm"
					onclick={() => table.nextPage()}
					disabled={!table.getCanNextPage()}
					class="gap-1.5"
				>
					Next
					<ChevronRightIcon class="size-4" />
				</Button>
			</div>
		</div>
	{/if}
</div>
