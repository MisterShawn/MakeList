<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Rename } from '$lib/components/ui/rename/index.js';
	import TagBadges from '$lib/components/TagBadges.svelte';
	import ResponsiveDialog from '$lib/components/ResponsiveDialog.svelte';
	import ItemFieldsEditor from '$lib/components/ItemFieldsEditor.svelte';
	import DataTable from '$lib/components/data-table/data-table.svelte';
	import {
		createColumns,
		toItemRow,
		type ItemFieldPatch,
		type ItemColorPatch,
		type ItemRow
	} from './columns.js';
	import * as q from '$lib/db/queries';
	import type { List, Item, Activity, MediaRef } from '$lib/db/types';
	import { buildItemFields } from '$lib/activity-types';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

	const listId = $derived(page.params.id);

	let list = $state<List | null | undefined>(undefined);
	let items = $state<Item[]>([]);
	let usedByActivities = $state<Activity[]>([]);

	let listNameValue = $state('');
	let listDescriptionValue = $state('');
	let descriptionMode = $state<'edit' | 'view'>('view');

	let itemDialogOpen = $state(false);
	let titleValue = $state('');
	let textValue = $state('');
	let iconValue = $state<string | undefined>(undefined);
	let emojiValue = $state<string | undefined>(undefined);
	let imageValue = $state<MediaRef | undefined>(undefined);
	let audioValue = $state<MediaRef | undefined>(undefined);
	let bgColorValue = $state<string | undefined>(undefined);
	let textColorValue = $state<string | undefined>(undefined);
	let saving = $state(false);

	let itemSearchText = $state('');

	function itemMatchesSearch(item: Item, query: string): boolean {
		if (item.title.toLowerCase().includes(query)) return true;
		return item.fields.some((field) => {
			if (field.type === 'text' || field.type === 'icon' || field.type === 'emoji') {
				return field.value.toLowerCase().includes(query);
			}
			return false;
		});
	}

	const filteredItems = $derived(
		itemSearchText.trim()
			? items.filter((item) => itemMatchesSearch(item, itemSearchText.trim().toLowerCase()))
			: items
	);

	const rows = $derived<ItemRow[]>(filteredItems.map(toItemRow));

	async function load() {
		const id = listId;
		if (!id) return;
		list = (await q.getList(id)) ?? null;
		if (!list) return;

		// Populate the inline rename fields from the freshly-loaded list.
		listNameValue = list.name;
		listDescriptionValue = list.description ?? '';
		descriptionMode = 'view';

		items = await q.listItemsForList(id);
		usedByActivities = await q.getActivitiesForList(id);
	}

	onMount(load);

	async function saveListName(value: string) {
		if (!list) return;
		await q.updateList(list.id, { name: value.trim() });
		toast.success('List updated');
		await load();
	}

	async function saveListDescription(value: string) {
		if (!list) return;
		await q.updateList(list.id, { description: value.trim() || undefined });
		toast.success('List updated');
		await load();
	}

	function openCreateItemDialog() {
		titleValue = '';
		textValue = '';
		iconValue = undefined;
		emojiValue = undefined;
		imageValue = undefined;
		audioValue = undefined;
		bgColorValue = undefined;
		textColorValue = undefined;
		itemDialogOpen = true;
	}

	async function saveItem() {
		if (!list) return;
		const title = titleValue.trim();
		if (!title) return;
		saving = true;
		try {
			const fields = buildItemFields({
				text: textValue,
				icon: iconValue,
				emoji: emojiValue,
				image: imageValue,
				audio: audioValue
			});
			await q.createItem(list.id, {
				title,
				fields,
				bgColor: bgColorValue,
				textColor: textColorValue
			});
			toast.success('Item added');
			itemDialogOpen = false;
			await load();
		} finally {
			saving = false;
		}
	}

	async function saveItemTitle(item: ItemRow, title: string) {
		const trimmed = title.trim();
		if (!trimmed) return;
		await q.updateItem(item.id, { title: trimmed });
		toast.success('Item updated');
		await load();
	}

	// Cell popovers in the items table each edit one field at a time — merge the changed
	// field into the item's other current values (read from the row, since that already
	// reflects the 5 fixed field-type slots) and save.
	async function saveItemField(item: ItemRow, patch: ItemFieldPatch) {
		const merged = {
			text: patch.text ?? item.text,
			icon: 'icon' in patch ? patch.icon : item.icon,
			emoji: 'emoji' in patch ? patch.emoji : item.emoji,
			image: 'image' in patch ? patch.image : item.image,
			audio: 'audio' in patch ? patch.audio : item.audio
		};
		const fields = buildItemFields(merged, item.fields);
		await q.updateItem(item.id, { fields });
		toast.success('Item updated');
		await load();
	}

	async function saveItemColor(item: ItemRow, patch: ItemColorPatch) {
		await q.updateItem(item.id, patch);
		toast.success('Item updated');
		await load();
	}

	function editItem(item: ItemRow) {
		if (!list) return;
		goto(resolve('/lists/[id]/items/[itemId]', { id: list.id, itemId: item.id }));
	}

	async function deleteItem(item: Item) {
		await q.softDeleteItem(item.id);
		toast.success(`Moved "${item.title}" to trash`);
		await load();
	}

	const columns = createColumns({
		onSaveTitle: saveItemTitle,
		onSaveField: saveItemField,
		onSaveColor: saveItemColor,
		onEdit: editItem,
		onDelete: (row) => deleteItem(row)
	});

	async function deleteList() {
		if (!list) return;
		await q.softDeleteList(list.id);
		toast.success(`Moved "${list.name}" to trash`);
		await goto(resolve('/lists'));
	}
</script>

{#if list === undefined}
	<p class="text-muted-foreground">Loading…</p>
{:else if list === null}
	<p class="text-muted-foreground">List not found.</p>
{:else}
	<div class="space-y-6">
		<div>
			<Button href="/lists" variant="ghost" size="sm" class="mb-2 gap-1.5">
				<ArrowLeftIcon class="size-4" />
				Lists
			</Button>
			<div class="flex items-start justify-between">
				<div>
					<Rename
						this="h1"
						class="text-2xl font-semibold"
						bind:value={listNameValue}
						onSave={saveListName}
						validate={(v) => v.trim().length > 0}
					/>
					{#if listDescriptionValue || descriptionMode === 'edit'}
						<Rename
							this="p"
							inputTag="textarea"
							class="text-muted-foreground"
							bind:value={listDescriptionValue}
							bind:mode={descriptionMode}
							onSave={saveListDescription}
						/>
					{:else}
						<button
							type="button"
							class="text-sm text-muted-foreground underline-offset-2 hover:underline"
							onclick={() => (descriptionMode = 'edit')}
						>
							Add description
						</button>
					{/if}
					{#if usedByActivities.length > 0}
						<div class="mt-2 flex flex-wrap items-center gap-1.5">
							<span class="text-xs text-muted-foreground">Used by:</span>
							{#each usedByActivities as activity (activity.id)}
								<a href={resolve('/activities/[id]', { id: activity.id })}>
									<Badge variant="outline">{activity.name}</Badge>
								</a>
							{/each}
						</div>
					{/if}
					{#if list.tags?.length}
						<div class="mt-2">
							<TagBadges tags={list.tags} />
						</div>
					{/if}
				</div>
				<div class="flex gap-2">
					<Button variant="destructive" size="lg" onclick={deleteList} class="gap-1.5">
						<Trash2Icon class="size-4" />
						Trash
					</Button>
				</div>
			</div>
		</div>

		<!-- Items List -->
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-medium">Items ({items.length})</h2>
				<Button onclick={openCreateItemDialog} size="sm" class="gap-1.5">
					<PlusIcon class="size-4" />
					Add Item
				</Button>
			</div>

			{#if items.length === 0}
				<p class="text-muted-foreground">No items yet. Add one to get started.</p>
			{:else}
				<Input placeholder="Search items…" bind:value={itemSearchText} class="max-w-sm" />

				<DataTable
					data={rows}
					{columns}
					emptyMessage={`No items match "${itemSearchText.trim()}".`}
					paginated
				/>
			{/if}
		</div>
	</div>

	<ResponsiveDialog
		bind:open={itemDialogOpen}
		title="New item"
		description="Title is required. Add any mix of text, icon, emoji, image, or audio."
	>
		<div class="space-y-4">
			<div class="space-y-1.5">
				<Label for="item-title">Title</Label>
				<Input id="item-title" bind:value={titleValue} placeholder="e.g. Dog" />
			</div>
			<ItemFieldsEditor
				bind:text={textValue}
				bind:icon={iconValue}
				bind:emoji={emojiValue}
				bind:image={imageValue}
				bind:audio={audioValue}
				bind:bgColor={bgColorValue}
				bind:textColor={textColorValue}
			/>
		</div>
		{#snippet footer()}
			<Button variant="outline" onclick={() => (itemDialogOpen = false)}>Cancel</Button>
			<Button onclick={saveItem} disabled={!titleValue.trim() || saving}>Save</Button>
		{/snippet}
	</ResponsiveDialog>
{/if}
