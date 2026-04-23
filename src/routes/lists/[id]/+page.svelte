<script lang="ts">
	import { page } from "$app/state";
	import { onMount, tick } from "svelte";
	import {
		getList,
		getItems,
		getTags,
		updateList,
		createItem,
		updateItem,
		softDeleteItem,
		getNextItemPosition,
		reorderItems,
	} from "$lib/db/queries";

	import type { List, Item, Tag } from "$lib/db/schema";
	import { toast } from "svelte-sonner";
	import ItemEditDialog from "$lib/components/ItemEditDialog.svelte";
	import EditDrawer from "$lib/components/EditDrawer.svelte";
	import { Button, buttonVariants } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Textarea } from "$lib/components/ui/textarea";
	import { cn } from "$lib/utils";
	import PageHeader from "$lib/components/PageHeader.svelte";
	import * as Table from "$lib/components/ui/table";
	import * as Popover from "$lib/components/ui/popover";
	import * as Command from "$lib/components/ui/command";
	import { Checkbox } from "$lib/components/ui/checkbox";
	import TagCreateDialog from "$lib/components/TagCreateDialog.svelte";
	import {
		createTable,
		getCoreRowModel,
		getSortedRowModel,
		type ColumnDef,
		type SortingState,
		type RowSelectionState,
	} from "@tanstack/table-core";
	import {
		draggable,
		droppable,
		type DragDropState,
	} from "@thisux/sveltednd";
	import {
		Plus,
		Pencil,
		Trash2,
		GripVertical,
		ArrowDownUp,
		ArrowDownAZ,
		ArrowDownZA,
	} from "lucide-svelte";

	// ── Route param ────────────────────────────────────────────────────────────

	const listId = Number(page.params.id);

	// ── State ──────────────────────────────────────────────────────────────────

	let list = $state<List | undefined>(undefined);
	let items = $state<Item[]>([]);
	let loading = $state(true);
	let notFound = $state(false);

	// Edit list metadata (inline)
	let editListName = $state("");
	let editListDesc = $state("");

	// New item row
	let newItemText = $state("");
	let newItemRef = $state<HTMLInputElement | null>(null);
	let addingItem = $state(false);

	// Item edit dialog
	let selectedItem = $state<Item | null>(null);
	let itemDialogOpen = $state(false);

	// Tags
	let allTags = $state<Tag[]>([]);
	let tagComboOpen = $state(false);
	let tagSearch = $state("");
	let tagCreateOpen = $state(false);
	let tagCreateInitialName = $state("");

	const listTags = $derived(
		list ? allTags.filter((t) => list!.tagIds.includes(t.id!)) : [],
	);
	const availableTags = $derived(
		list ? allTags.filter((t) => !list!.tagIds.includes(t.id!)) : allTags,
	);

	// ── Data ───────────────────────────────────────────────────────────────────

	onMount(async () => {
		const [l, i, t] = await Promise.all([getList(listId), getItems(listId), getTags()]);
		if (!l) {
			notFound = true;
		} else {
			list = l;
			items = i;
			editListName = l.name;
			editListDesc = l.description ?? "";
		}
		allTags = t;
		loading = false;
	});

	// ── Tag operations ─────────────────────────────────────────────────────────

	async function addTag(tag: Tag) {
		if (!list) return;
		const tagIds = [...list.tagIds, tag.id!];
		await updateList(list.id!, { tagIds });
		list = { ...list, tagIds };
	}

	async function removeTag(tag: Tag) {
		if (!list) return;
		const tagIds = list.tagIds.filter((id) => id !== tag.id);
		await updateList(list.id!, { tagIds });
		list = { ...list, tagIds };
	}

	async function handleTagCreated(tag: Tag) {
		allTags = [...allTags, tag];
		await addTag(tag);
	}

	function openCreateTag() {
		tagCreateInitialName = tagSearch;
		tagSearch = "";
		tagComboOpen = false;
		tagCreateOpen = true;
	}

	// ── Edit list metadata (inline, auto-save on blur) ────────────────────────

	async function saveListMeta() {
		if (!list || !editListName.trim()) return;
		const name = editListName.trim();
		const description = editListDesc.trim() || undefined;
		if (name === list.name && description === list.description) return;
		await updateList(list.id!, { name, description });
		list = { ...list, name, description };
	}

	// ── Add item ───────────────────────────────────────────────────────────────

	async function addItem() {
		const text = newItemText.trim();
		if (!text || addingItem) return;
		addingItem = true;
		try {
			const position = await getNextItemPosition(listId);
			const id = await createItem({ listId, text, position, tagIds: [] });
			const now = new Date();
			const newItem: Item = {
				id,
				listId,
				text,
				position,
				tagIds: [],
				createdAt: now,
				updatedAt: now,
			};
			items = [...items, newItem];
			newItemText = "";
		} finally {
			addingItem = false;
		}
		await tick();
		newItemRef?.focus();
	}

	function handleNewItemKeydown(e: KeyboardEvent) {
		if (e.key === "Enter") {
			e.preventDefault();
			addItem();
		}
		if (e.key === "Escape") {
			newItemText = "";
			newItemRef?.blur();
		}
	}

	// ── Item dialog ────────────────────────────────────────────────────────────

	function openItemDialog(item: Item) {
		selectedItem = item;
		itemDialogOpen = true;
	}

	async function handleItemSave(id: number, updates: Partial<Item>) {
		await updateItem(id, updates);
		items = items.map((i) =>
			i.id === id ? { ...i, ...updates, updatedAt: new Date() } : i,
		);
	}

	// ── Delete item (with timed undo) ─────────────────────────────────────────

	const pendingDeletes = new Map<number, ReturnType<typeof setTimeout>>();

	function scheduleDelete(toDelete: Item[]) {
		const ids = new Set(toDelete.map((i) => i.id!));
		items = items.filter((i) => !ids.has(i.id!));

		const label =
			toDelete.length === 1
				? `"${toDelete[0].text}" moved to trash`
				: `${toDelete.length} items moved to trash`;

		toast(label, {
			duration: 5000,
			action: {
				label: "Undo",
				onClick: () => {
					toDelete.forEach((item) => {
						const tid = pendingDeletes.get(item.id!);
						if (tid) clearTimeout(tid);
						pendingDeletes.delete(item.id!);
					});
					items = [...items, ...toDelete].sort(
						(a, b) => a.position - b.position,
					);
				},
			},
		});

		toDelete.forEach((item) => {
			const tid = setTimeout(() => {
				pendingDeletes.delete(item.id!);
				softDeleteItem(item.id!);
			}, 5000);
			pendingDeletes.set(item.id!, tid);
		});
	}

	function deleteItem(item: Item, e: MouseEvent) {
		e.stopPropagation();
		scheduleDelete([item]);
	}

	function deleteSelected() {
		const selected = table
			.getSelectedRowModel()
			.rows.map((r) => r.original);
		rowSelection = {};
		scheduleDelete(selected);
	}

	// ── Reorder (drag-and-drop) ────────────────────────────────────────────────

	let editing = $state(false);
	let reordering = $state(false);

	function handleDrop(state: DragDropState<Item>) {
		const dragged = state.draggedItem;
		const targetId = Number(state.targetContainer);
		const srcIdx = items.findIndex((i) => i.id === dragged.id);
		const tgtIdx = items.findIndex((i) => i.id === targetId);
		if (srcIdx === -1 || tgtIdx === -1 || srcIdx === tgtIdx) return;
		const updated = [...items];
		const [moved] = updated.splice(srcIdx, 1);
		const newTgtIdx = updated.findIndex((i) => i.id === targetId);
		updated.splice(
			state.dropPosition === "after" ? newTgtIdx + 1 : newTgtIdx,
			0,
			moved,
		);
		items = updated;
	}

	function doneEditing() {
		editing = false;
		rowSelection = {};
	}

	async function doneReordering() {
		const ordered = table
			.getRowModel()
			.rows.map((r, idx) => ({ ...r.original, position: idx }));
		items = ordered;
		sorting = [];
		reordering = false;
		await reorderItems(
			listId,
			ordered.map((i) => i.id!),
		);
	}

	// ── Data table ─────────────────────────────────────────────────────────────

	const columns: ColumnDef<Item>[] = [
		{ id: "select", enableSorting: false },
		{ id: "emoji", header: "Icon", enableSorting: false },
		{
			id: "text",
			accessorKey: "text",
			header: "Item",
			enableSorting: true,
			sortingFn: "alphanumeric",
		},
		{
			id: "subtext",
			accessorKey: "subtext",
			header: "Description",
			enableSorting: false,
		},
		{ id: "actions", enableSorting: false },
	];

	let sorting = $state<SortingState>([]);
	let rowSelection = $state<RowSelectionState>({});

	const table = $derived(
		createTable({
			data: items,
			columns,
			state: {
				sorting,
				rowSelection,
				columnPinning: { left: [], right: [] },
			},
			onStateChange() {},
			onSortingChange(updater) {
				sorting =
					typeof updater === "function" ? updater(sorting) : updater;
			},
			onRowSelectionChange(updater) {
				rowSelection =
					typeof updater === "function"
						? updater(rowSelection)
						: updater;
			},
			enableRowSelection: true,
			getCoreRowModel: getCoreRowModel(),
			getSortedRowModel: getSortedRowModel(),
			renderFallbackValue: null,
		}),
	);
</script>

<svelte:head>
	<title>{list?.name ?? "List"} — MakeList</title>
</svelte:head>

{#if loading}
	<p class="p-6 text-sm text-muted-foreground">Loading…</p>
{:else if notFound}
	<div class="flex flex-col items-center gap-3 p-12 text-center">
		<p class="text-muted-foreground">List not found.</p>
		<a
			href="/lists"
			class="text-sm text-primary underline-offset-4 hover:underline"
			>← Back to lists</a
		>
	</div>
{:else if list}
	<div class="flex h-full flex-col">
		<PageHeader crumbs={[{ label: 'Lists', href: '/lists' }, { label: list.name }]}>
			{#snippet actions()}
				<Button
					variant={reordering ? "secondary" : "outline"}
					size="sm"
					onclick={() =>
						reordering
							? doneReordering()
							: ((reordering = true),
								(editing = false),
								(rowSelection = {}))}
				>
					<GripVertical size={13} />
					{reordering ? "Done" : "Reorder"}
				</Button>
				<Button
					variant={editing ? "secondary" : "outline"}
					size="sm"
					onclick={() =>
						editing
							? doneEditing()
							: ((editing = true), (reordering = false))}
				>
					<Pencil size={13} />
					{editing ? "Done" : "Edit"}
				</Button>
			{/snippet}
		</PageHeader>

		<!-- ── List title & description (inline edit) ────────────────────────── -->
		<div class="border-b border-border px-6 py-5 text-center">
			{#if editing}
				<div class="flex flex-col items-center gap-3">
					<div class="flex items-center gap-2">
						<Label for="list-name" class="text-xs uppercase tracking-wide text-muted-foreground">Name</Label>
						<Input
							id="list-name"
							type="text"
							bind:value={editListName}
							onblur={saveListMeta}
							onkeydown={(e) =>
								e.key === "Enter" &&
								(e.currentTarget as HTMLInputElement).blur()}
							style="field-sizing: content"
							class="w-auto max-w-full text-center text-xl font-semibold border-dashed"
						/>
					</div>
					<div class="flex items-center gap-2">
						<Label for="list-desc" class="text-xs uppercase tracking-wide text-muted-foreground">Description</Label>
						<Textarea
							id="list-desc"
							bind:value={editListDesc}
							onblur={saveListMeta}
							placeholder="Add a description…"
							class="max-w-full text-center text-sm text-muted-foreground border-dashed min-h-0"
						/>
					</div>
				</div>
			{:else}
				<p class="text-xl font-semibold px-2 py-0.5">{list.name}</p>
				{#if list.description}
					<p class="mt-1 text-sm text-muted-foreground px-2 py-0.5">{list.description}</p>
				{/if}
			{/if}

			<!-- ── Tags ────────────────────────────────────────────────────────── -->
			{#if listTags.length > 0 || editing}
				<div class="mt-3 flex flex-wrap items-center justify-center gap-2">
					{#if editing}
						<Popover.Root bind:open={tagComboOpen}>
							<Popover.Trigger
								class={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 rounded-full text-xs")}
							>
								<Plus size={12} />
								Add tag
							</Popover.Trigger>
							<Popover.Content class="w-48 p-0" align="start">
								<Command.Root shouldFilter={false}>
									<Command.Input placeholder="Search tags…" bind:value={tagSearch} />
									<Command.List>
										{#each availableTags.filter((t) => t.name.toLowerCase().includes(tagSearch.toLowerCase())) as tag (tag.id)}
											<Command.Item value={tag.name} onSelect={() => addTag(tag)}>
												<span
													class="h-3 w-3 shrink-0 rounded-full"
													style="background-color: {tag.color}"
												></span>
												{tag.name}
											</Command.Item>
										{/each}
										<Command.Item value="__create__" onSelect={openCreateTag}>
											<Plus size={13} />
											{tagSearch.trim() ? `Create "${tagSearch.trim()}"` : "New tag…"}
										</Command.Item>
									</Command.List>
								</Command.Root>
							</Popover.Content>
						</Popover.Root>
					{/if}
					{#each listTags as tag (tag.id)}
						{#if editing}
							<span
								class="inline-flex items-center gap-1 rounded-full py-1 pl-3 pr-1 text-sm font-medium text-white"
								style="background-color: {tag.color}"
							>
								{tag.name}
								<Button
									variant="ghost"
									size="icon"
									class="h-5 w-5 rounded-full text-white/70 hover:bg-black/10 hover:text-white"
									onclick={() => removeTag(tag)}
								>
									<Trash2 size={11} />
								</Button>
							</span>
						{:else}
							<span
								class="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white"
								style="background-color: {tag.color}"
							>
								{tag.name}
							</span>
						{/if}
					{/each}
				</div>
			{/if}
		</div>

		<!-- ── Items list ──────────────────────────────────────────────────────── -->
		<div class="flex-1 overflow-y-auto">
			<Table.Root>
				<Table.Header>
					{#each table.getHeaderGroups() as headerGroup}
						<Table.Row class="hover:bg-transparent">
							{#each headerGroup.headers as header}
								<Table.Head
									class={{
										select: "w-8",
										emoji: "w-10",
										text: "w-[24ch]",
										actions: "w-8",
									}[header.id] ?? ""}
								>
									{#if header.id === "select"}
										{#if editing}
											<Checkbox
												checked={table.getIsAllRowsSelected()}
												indeterminate={table.getIsSomeRowsSelected() &&
													!table.getIsAllRowsSelected()}
												onCheckedChange={() =>
													table.toggleAllRowsSelected()}
												aria-label="Select all"
											/>
										{/if}
									{:else if header.column.getCanSort()}
										<Button
											variant="ghost"
											size="sm"
											class="-ml-2"
											onclick={() =>
												header.column.toggleSorting()}
										>
											{header.column.columnDef
												.header as string}
											{#if header.column.getIsSorted() === "asc"}
												<ArrowDownAZ size={14} />
											{:else if header.column.getIsSorted() === "desc"}
												<ArrowDownZA size={14} />
											{:else}
												<ArrowDownUp
													size={14}
													class="text-muted-foreground/50"
												/>
											{/if}
										</Button>
									{:else if typeof header.column.columnDef.header === "string"}
										<span class="text-xs font-medium"
											>{header.column.columnDef
												.header}</span
										>
									{/if}
								</Table.Head>
							{/each}
						</Table.Row>
					{/each}
				</Table.Header>
				<Table.Body>
					{#if items.length === 0}
						<Table.Row class="hover:bg-transparent border-0">
							<Table.Cell
								colspan={5}
								class="pt-16 text-center text-sm text-muted-foreground"
							>
								No items yet — add the first one below.
							</Table.Cell>
						</Table.Row>
					{:else}
						{#each table.getRowModel().rows as row (row.id)}
							{@const item = row.original}
							<tr
								class={cn(
									"group items-start border-b transition-colors",
									!editing &&
										!reordering &&
										"cursor-pointer hover:bg-accent/30",
									editing &&
										"cursor-pointer select-none hover:bg-accent/50",
									reordering &&
										"cursor-grab active:cursor-grabbing select-none hover:bg-muted/50",
									row.getIsSelected() &&
										"bg-accent/60 hover:bg-accent/60",
								)}
								onclick={editing
									? () => row.toggleSelected()
									: !reordering
										? () => openItemDialog(item)
										: undefined}
								use:draggable={{
									container: String(item.id),
									dragData: item,
									disabled: !reordering,
									attributes: { draggingClass: "opacity-40" },
								}}
								use:droppable={{
									container: String(item.id),
									disabled: !reordering,
									attributes: {
										dragOverClass: "bg-accent/60",
									},
									callbacks: { onDrop: handleDrop },
								}}
							>
								<!-- Select -->
								<Table.Cell class="w-0 px-2">
									{#if editing}
										<Checkbox
											checked={row.getIsSelected()}
											onCheckedChange={() =>
												row.toggleSelected()}
											aria-label="Select row"
										/>
									{/if}
								</Table.Cell>

								<!-- Emoji / color -->
								<Table.Cell class="w-10 px-1 py-2 align-top">
									{#if item.emojiId}
										<div class="relative mt-0.5 h-7 w-7">
											<img
												src="/openmoji/{item.emojiId}.svg"
												alt=""
												class="h-7 w-7 select-none"
												draggable="false"
											/>
											{#if item.color}
												<span
													class="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-1 ring-background"
													style="background-color: {item.color}"
												></span>
											{/if}
										</div>
									{:else if item.color}
										<span
											class="mt-0.5 block h-5 w-5 rounded-full"
											style="background-color: {item.color}"
										></span>
									{/if}
								</Table.Cell>

								<!-- Text -->
								<Table.Cell class="px-2 py-2 align-top">
									<span
										class="block max-w-[24ch] truncate text-sm"
										>{item.text}</span
									>
								</Table.Cell>

								<!-- Subtext -->
								<Table.Cell
									class="w-full min-w-0 px-2 py-2 align-top"
								>
									{#if item.subtext}
										<span
											class="block truncate text-sm text-muted-foreground"
											>{item.subtext}</span
										>
									{/if}
								</Table.Cell>

								<!-- Actions -->
								<Table.Cell class="w-8 px-2 py-2 align-top">
									<Button
										variant="ghost"
										size="icon"
										onclick={(e) => deleteItem(item, e)}
										title="Delete item"
										class="h-7 w-7 text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-destructive"
									>
										<Trash2 size={14} />
									</Button>
								</Table.Cell>
							</tr>
						{/each}
					{/if}
				</Table.Body>
			</Table.Root>

			<!-- ── Add item row ─────────────────────────────────────────────────── -->
			<div
				class="flex items-center justify-center gap-3 border-t border-border px-6 py-3"
			>
				<Plus size={14} class="shrink-0 text-muted-foreground/40" />
				<input
					type="text"
					placeholder="Add an item…"
					bind:value={newItemText}
					bind:this={newItemRef}
					onkeydown={handleNewItemKeydown}
					disabled={addingItem}
					class="w-64 bg-transparent py-1 text-center text-sm outline-none placeholder:text-muted-foreground/40 disabled:opacity-50"
				/>
				{#if newItemText.trim()}
					<Button size="sm" onclick={addItem} disabled={addingItem}>
						{addingItem ? "…" : "Add"}
					</Button>
				{/if}
			</div>
		</div>

		<EditDrawer
			open={Object.keys(rowSelection).length > 0}
			selectedCount={Object.keys(rowSelection).length}
			onclose={doneEditing}
		>
			<Button
				variant="ghost"
				size="sm"
				class="text-destructive hover:text-destructive"
				onclick={deleteSelected}
			>
				<Trash2 size={14} />
				Delete
			</Button>
		</EditDrawer>
	</div>
{/if}

<!-- ── Tag create dialog ──────────────────────────────────────────────────── -->
<TagCreateDialog
	bind:open={tagCreateOpen}
	initialName={tagCreateInitialName}
	oncreate={handleTagCreated}
/>

<!-- ── Item edit dialog ────────────────────────────────────────────────────── -->
<ItemEditDialog
	item={selectedItem}
	bind:open={itemDialogOpen}
	onsave={handleItemSave}
	ondelete={() => { if (selectedItem) scheduleDelete([selectedItem]); itemDialogOpen = false; }}
/>
