<script lang="ts">
	import { onMount } from 'svelte';
	import { getLists, createList, updateList, softDeleteList, getItems } from '$lib/db/queries';
	import type { List } from '$lib/db/schema';
	import ResponsiveDialog from '$lib/components/ResponsiveDialog.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Plus, MoreHorizontal, Pencil, Trash2, List as ListIcon } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import PageHeader from '$lib/components/PageHeader.svelte';

	// ── State ──────────────────────────────────────────────────────────────────

	let lists = $state<List[]>([]);
	let itemCounts = $state<Record<number, number>>({});
	let loading = $state(true);

	// Create / edit dialog
	let dialogOpen = $state(false);
	let editingList = $state<List | null>(null);
	let formName = $state('');
	let formDesc = $state('');
	let saving = $state(false);

	// ── Derived ────────────────────────────────────────────────────────────────

	const dialogTitle = $derived(editingList ? 'Edit list' : 'New list');
	const canSave = $derived(formName.trim().length > 0);

	// ── Data loading ───────────────────────────────────────────────────────────

	onMount(async () => {
		await load();
		loading = false;
	});

	async function load() {
		lists = await getLists();
		const counts: Record<number, number> = {};
		await Promise.all(
			lists.map(async (l) => {
				const items = await getItems(l.id!);
				counts[l.id!] = items.length;
			})
		);
		itemCounts = counts;
	}

	// ── Dialog helpers ─────────────────────────────────────────────────────────

	function openCreate() {
		editingList = null;
		formName = '';
		formDesc = '';
		dialogOpen = true;
	}

	function openEdit(list: List, e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		editingList = list;
		formName = list.name;
		formDesc = list.description ?? '';
		dialogOpen = true;
	}

	async function handleSave() {
		if (!canSave || saving) return;
		saving = true;
		try {
			if (editingList) {
				await updateList(editingList.id!, {
					name: formName.trim(),
					description: formDesc.trim() || undefined
				});
			} else {
				await createList({
					name: formName.trim(),
					description: formDesc.trim() || undefined,
					tagIds: []
				});
			}
			dialogOpen = false;
			await load();
		} finally {
			saving = false;
		}
	}

	function handleFormKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSave();
		}
	}

	// ── Delete ─────────────────────────────────────────────────────────────────

	function handleDelete(list: List, e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		const savedCount = itemCounts[list.id!];
		lists = lists.filter((l) => l.id !== list.id);
		const counts = { ...itemCounts };
		delete counts[list.id!];
		itemCounts = counts;

		let tid: ReturnType<typeof setTimeout>;
		toast(`"${list.name}" moved to trash`, {
			duration: 5000,
			action: {
				label: 'Undo',
				onClick: () => {
					clearTimeout(tid);
					lists = [...lists, list].sort((a, b) => a.name.localeCompare(b.name));
					itemCounts = { ...itemCounts, [list.id!]: savedCount };
				},
			},
		});
		tid = setTimeout(() => softDeleteList(list.id!), 5000);
	}
</script>

<svelte:head><title>Lists — MakeList</title></svelte:head>

<div class="flex h-full flex-col">
	<PageHeader crumbs={[{ label: 'Lists' }]}>
		{#snippet actions()}
			<Button size="sm" onclick={openCreate}>
				<Plus size={14} />
				New list
			</Button>
		{/snippet}
	</PageHeader>

	<!-- ── Content ───────────────────────────────────────────────────────────── -->
	<div class="flex-1 overflow-y-auto p-6">
		{#if loading}
			<p class="text-sm text-muted-foreground">Loading…</p>
		{:else if lists.length === 0}
			<div class="flex flex-col items-center gap-3 pt-16 text-center">
				<ListIcon size={32} class="text-muted-foreground/40" />
				<p class="text-sm text-muted-foreground">No lists yet. Create your first one.</p>
				<Button onclick={openCreate}>
					<Plus size={15} />
					New list
				</Button>
			</div>
		{:else}
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each lists as list (list.id)}
					{@const count = itemCounts[list.id!] ?? 0}
					<div
						class="group relative flex flex-col gap-2 rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-sm"
					>
						<!-- Full-card link -->
						<a
							href="/lists/{list.id}"
							class="absolute inset-0 rounded-lg"
							aria-label={list.name}
						></a>

						<div class="flex items-start justify-between gap-2">
							<h2 class="line-clamp-2 font-medium leading-snug">{list.name}</h2>

							<!-- Actions menu — sits above the link via z-index -->
							<div class="relative z-10 shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										<Button
											variant="ghost"
											size="icon"
											class="h-7 w-7"
											aria-label="List actions"
										>
											<MoreHorizontal size={15} />
										</Button>
									</DropdownMenu.Trigger>
									<DropdownMenu.Content align="end" class="w-40">
										<DropdownMenu.Item onclick={(e) => openEdit(list, e)}>
											<Pencil size={13} class="mr-2" />
											Edit
										</DropdownMenu.Item>
										<DropdownMenu.Separator />
										<DropdownMenu.Item
											onclick={(e) => handleDelete(list, e)}
											class="text-destructive focus:text-destructive"
										>
											<Trash2 size={13} class="mr-2" />
											Delete
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</div>
						</div>

						{#if list.description}
							<p class="line-clamp-2 text-xs text-muted-foreground">{list.description}</p>
						{/if}

						<p class="mt-auto text-xs text-muted-foreground">
							{count}
							{count === 1 ? 'item' : 'items'}
						</p>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- ── Create / Edit dialog ──────────────────────────────────────────────── -->
<ResponsiveDialog bind:open={dialogOpen} title={dialogTitle} class="max-w-sm">
	{#snippet children()}
		<div class="flex flex-col gap-4 py-2">
			<div class="flex flex-col gap-1.5">
				<Label for="list-name">Name</Label>
				<Input
					id="list-name"
					type="text"
					placeholder="e.g. Spanish vocabulary"
					bind:value={formName}
					onkeydown={handleFormKeydown}
				/>
			</div>

			<div class="flex flex-col gap-1.5">
				<Label for="list-desc" class="text-muted-foreground">
					Description
					<span class="font-normal">(optional)</span>
				</Label>
				<textarea
					id="list-desc"
					placeholder="What is this list for?"
					bind:value={formDesc}
					rows={3}
					class="resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground"
				></textarea>
			</div>
		</div>
	{/snippet}
	{#snippet footer()}
		<Button variant="outline" onclick={() => (dialogOpen = false)}>Cancel</Button>
		<Button onclick={handleSave} disabled={!canSave || saving}>
			{saving ? 'Saving…' : 'Save'}
		</Button>
	{/snippet}
</ResponsiveDialog>
