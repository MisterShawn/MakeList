<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import ResponsiveDialog from '$lib/components/ResponsiveDialog.svelte';
	import DataTable from '$lib/components/data-table/data-table.svelte';
	import { createColumns, type ListRow } from './columns.js';
	import * as q from '$lib/db/queries';
	import type { List } from '$lib/db/types';
	import PlusIcon from '@lucide/svelte/icons/plus';

	let lists = $state<List[]>([]);
	let itemCounts = $state<Record<string, number>>({});
	let tagSuggestions = $state<string[]>([]);
	let searchText = $state('');

	let dialogOpen = $state(false);
	let nameValue = $state('');
	let descriptionValue = $state('');
	let saving = $state(false);

	async function refresh() {
		lists = await q.listActiveLists();
		const counts: Record<string, number> = {};
		await Promise.all(
			lists.map(async (l) => {
				counts[l.id] = (await q.listItemsForList(l.id)).length;
			})
		);
		itemCounts = counts;
		tagSuggestions = await q.listAllTags();
	}

	onMount(refresh);

	const filteredLists = $derived(
		searchText.trim()
			? lists.filter((l) => l.name.toLowerCase().includes(searchText.trim().toLowerCase()))
			: lists
	);

	const rows = $derived<ListRow[]>(
		filteredLists.map((list) => ({ ...list, itemCount: itemCounts[list.id] ?? 0 }))
	);

	const columns = $derived(
		createColumns({
			onDelete: (row) => deleteList(row),
			onSaveTags: (row, tags) => saveListTags(row, tags),
			tagSuggestions
		})
	);

	function openCreateDialog() {
		nameValue = '';
		descriptionValue = '';
		dialogOpen = true;
	}

	async function saveList() {
		const name = nameValue.trim();
		if (!name) return;
		saving = true;
		try {
			await q.createList({
				name,
				description: descriptionValue.trim() || undefined,
				listType: 'generic'
			});
			toast.success('List created');
			dialogOpen = false;
			await refresh();
		} finally {
			saving = false;
		}
	}

	async function deleteList(list: List) {
		await q.softDeleteList(list.id);
		toast.success(`Moved "${list.name}" to trash`);
		await refresh();
	}

	async function saveListTags(list: List, tags: string[]) {
		await q.updateList(list.id, { tags });
		await refresh();
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-semibold">Lists</h1>
			<p class="text-muted-foreground">Build and organize collections of items.</p>
		</div>
		<Button onclick={openCreateDialog} class="gap-1.5">
			<PlusIcon class="size-4" />
			New List
		</Button>
	</div>

	<Input placeholder="Search lists…" bind:value={searchText} class="max-w-sm" />

	<DataTable
		data={rows}
		{columns}
		onRowClick={(row) => goto(resolve('/lists/[id]', { id: row.id }))}
		emptyMessage="No lists found."
	/>
</div>

<ResponsiveDialog bind:open={dialogOpen} title="New list">
	<div class="space-y-4">
		<div class="space-y-1.5">
			<Label for="list-name">Name</Label>
			<Input id="list-name" bind:value={nameValue} placeholder="e.g. Spelling Words" />
		</div>
		<div class="space-y-1.5">
			<Label for="list-description">Description</Label>
			<Textarea id="list-description" bind:value={descriptionValue} placeholder="Optional" />
		</div>
	</div>
	{#snippet footer()}
		<Button variant="outline" onclick={() => (dialogOpen = false)}>Cancel</Button>
		<Button onclick={saveList} disabled={!nameValue.trim() || saving}>Save</Button>
	{/snippet}
</ResponsiveDialog>
