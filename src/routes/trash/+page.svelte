<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Table from '$lib/components/ui/table';
	import {
		createTable,
		getCoreRowModel,
		getSortedRowModel,
		type ColumnDef,
		type SortingState,
		type RowSelectionState
	} from '@tanstack/table-core';
	import {
		getTrash,
		emptyTrash,
		restoreList, purgeList,
		restoreItem, purgeItem,
		restoreBoard, purgeBoard,
		restorePlayer, purgePlayer,
		restoreMediaAsset, purgeMediaAsset,
		restoreTag, purgeTag
	} from '$lib/db/queries';
	import { Trash2, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';

	// ── Types ──────────────────────────────────────────────────────────────────

	type TrashRow = {
		id: string;
		name: string;
		type: 'List' | 'Item' | 'Board' | 'Player' | 'Media' | 'Tag';
		deletedAt: Date;
		onRestore: () => Promise<void>;
		onPurge: () => Promise<void>;
	};

	// ── State ──────────────────────────────────────────────────────────────────

	let rows = $state<TrashRow[]>([]);
	let loading = $state(true);

	onMount(async () => {
		await load();
		loading = false;
	});

	async function load() {
		const trash = await getTrash();
		const r: TrashRow[] = [];

		for (const l of trash.lists) {
			r.push({ id: `list-${l.id}`, name: l.name, type: 'List', deletedAt: l.deletedAt!,
				onRestore: async () => { await restoreList(l.id!); await load(); },
				onPurge:   async () => { await purgeList(l.id!);   await load(); }
			});
		}
		for (const i of trash.items) {
			r.push({ id: `item-${i.id}`, name: i.text, type: 'Item', deletedAt: i.deletedAt!,
				onRestore: async () => { await restoreItem(i.id!); await load(); },
				onPurge:   async () => { await purgeItem(i.id!);   await load(); }
			});
		}
		for (const b of trash.boards) {
			r.push({ id: `board-${b.id}`, name: b.name, type: 'Board', deletedAt: b.deletedAt!,
				onRestore: async () => { await restoreBoard(b.id!); await load(); },
				onPurge:   async () => { await purgeBoard(b.id!);   await load(); }
			});
		}
		for (const p of trash.players) {
			r.push({ id: `player-${p.id}`, name: p.name, type: 'Player', deletedAt: p.deletedAt!,
				onRestore: async () => { await restorePlayer(p.id!); await load(); },
				onPurge:   async () => { await purgePlayer(p.id!);   await load(); }
			});
		}
		for (const m of trash.mediaAssets) {
			r.push({ id: `media-${m.id}`, name: m.name, type: 'Media', deletedAt: m.deletedAt!,
				onRestore: async () => { await restoreMediaAsset(m.id!); await load(); },
				onPurge:   async () => { await purgeMediaAsset(m.id!);   await load(); }
			});
		}
		for (const t of trash.tags) {
			r.push({ id: `tag-${t.id}`, name: t.name, type: 'Tag', deletedAt: t.deletedAt!,
				onRestore: async () => { await restoreTag(t.id!); await load(); },
				onPurge:   async () => { await purgeTag(t.id!);   await load(); }
			});
		}

		rows = r;
	}

	// ── Confirm dialog ─────────────────────────────────────────────────────────

	let confirmOpen = $state(false);
	let confirmTitle = $state('');
	let confirmDescription = $state('');
	let confirmAction = $state<() => Promise<void>>(() => Promise.resolve());

	function requestConfirm(title: string, description: string, action: () => Promise<void>) {
		confirmTitle = title;
		confirmDescription = description;
		confirmAction = action;
		confirmOpen = true;
	}

	async function handleEmptyTrash() {
		requestConfirm(
			'Empty trash?',
			'This will permanently delete everything in trash. This cannot be undone.',
			async () => { await emptyTrash(); await load(); }
		);
	}

	// ── Data table ─────────────────────────────────────────────────────────────

	const columns: ColumnDef<TrashRow>[] = [
		{ id: 'select', enableSorting: false },
		{ id: 'name',      accessorKey: 'name',      header: 'Name',    enableSorting: true },
		{ id: 'type',      accessorKey: 'type',      header: 'Type',    enableSorting: true },
		{ id: 'deletedAt', accessorKey: 'deletedAt', header: 'Deleted', enableSorting: true },
		{ id: 'actions', enableSorting: false },
	];

	let sorting = $state<SortingState>([{ id: 'deletedAt', desc: true }]);
	let rowSelection = $state<RowSelectionState>({});

	const table = $derived(
		createTable({
			data: rows,
			columns,
			state: { sorting, rowSelection, columnPinning: { left: [], right: [] } },
			onStateChange() {},
			onSortingChange(updater) {
				sorting = typeof updater === 'function' ? updater(sorting) : updater;
			},
			onRowSelectionChange(updater) {
				rowSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
			},
			enableRowSelection: true,
			getCoreRowModel: getCoreRowModel(),
			getSortedRowModel: getSortedRowModel(),
			renderFallbackValue: null,
		})
	);

	const TYPE_VARIANT: Record<TrashRow['type'], 'default' | 'secondary' | 'outline'> = {
		List:   'default',
		Item:   'secondary',
		Board:  'outline',
		Player: 'outline',
		Media:  'outline',
		Tag:    'outline',
	};

	function formatDate(d: Date) {
		return new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' });
	}
</script>

<svelte:head><title>Trash — MakeList</title></svelte:head>

<div class="flex h-full flex-col">
	<PageHeader crumbs={[{ label: 'Trash' }]}>
		{#snippet actions()}
			{#if rows.length > 0}
				<Button variant="destructive" size="sm" onclick={handleEmptyTrash}>
					<Trash2 size={14} /> Empty trash
				</Button>
			{/if}
		{/snippet}
	</PageHeader>

	<!-- Table -->
	<div class="flex-1 overflow-y-auto">
		{#if loading}
			<p class="p-6 text-sm text-muted-foreground">Loading…</p>
		{:else}
			<Table.Root>
				<Table.Header>
					{#each table.getHeaderGroups() as headerGroup}
						<Table.Row class="hover:bg-transparent">
							{#each headerGroup.headers as header}
								<Table.Head class={header.id === 'select' ? 'w-0' : header.column.getCanSort() ? '' : 'w-0'}>
									{#if header.id === 'select'}
										<Checkbox
											checked={table.getIsAllRowsSelected()}
											indeterminate={table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()}
											onCheckedChange={() => table.toggleAllRowsSelected()}
											aria-label="Select all"
										/>
									{:else if header.column.getCanSort()}
										<Button variant="ghost" size="sm" class="-ml-2" onclick={() => header.column.toggleSorting()}>
											{header.column.columnDef.header as string}
											{#if header.column.getIsSorted() === 'asc'}
												<ArrowUp size={14} />
											{:else if header.column.getIsSorted() === 'desc'}
												<ArrowDown size={14} />
											{:else}
												<ArrowUpDown size={14} class="text-muted-foreground/50" />
											{/if}
										</Button>
									{/if}
								</Table.Head>
							{/each}
						</Table.Row>
					{/each}
				</Table.Header>
				<Table.Body>
					{#if rows.length === 0}
						<Table.Row class="hover:bg-transparent border-0">
							<Table.Cell colspan={5} class="pt-16 text-center text-sm text-muted-foreground">
								Trash is empty.
							</Table.Cell>
						</Table.Row>
					{:else}
						{#each table.getRowModel().rows as row (row.id)}
							{@const item = row.original}
							<Table.Row>
								<Table.Cell class="w-0 px-2">
									<Checkbox
										checked={row.getIsSelected()}
										onCheckedChange={() => row.toggleSelected()}
										aria-label="Select row"
									/>
								</Table.Cell>
								<Table.Cell class="font-medium">{item.name}</Table.Cell>
								<Table.Cell>
									<Badge variant={TYPE_VARIANT[item.type]}>{item.type}</Badge>
								</Table.Cell>
								<Table.Cell class="text-muted-foreground">{formatDate(item.deletedAt)}</Table.Cell>
								<Table.Cell class="text-right">
									<div class="flex items-center justify-end gap-1">
										<Button variant="ghost" size="icon-sm" onclick={item.onRestore} title="Restore">
											<RotateCcw size={14} />
										</Button>
										<Button
											variant="ghost"
											size="icon-sm"
											title="Delete permanently"
											class="text-muted-foreground hover:text-destructive"
											onclick={() => requestConfirm(
												`Delete "${item.name}" permanently?`,
												'This cannot be undone.',
												item.onPurge
											)}
										>
											<Trash2 size={14} />
										</Button>
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					{/if}
				</Table.Body>
			</Table.Root>
		{/if}
	</div>
</div>

<AlertDialog.Root bind:open={confirmOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>{confirmTitle}</AlertDialog.Title>
			<AlertDialog.Description>{confirmDescription}</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={async () => { confirmOpen = false; await confirmAction(); }} class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
				Delete permanently
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
