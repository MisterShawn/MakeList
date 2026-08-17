<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Rename } from '$lib/components/ui/rename/index.js';
	import ItemFieldsEditor from '$lib/components/ItemFieldsEditor.svelte';
	import { cn } from '$lib/utils.js';
	import * as q from '$lib/db/queries';
	import { buildItemFields, readItemFields } from '$lib/activity-types';
	import type { Item, List, MediaRef } from '$lib/db/types';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

	const listId = $derived(page.params.id);
	const itemId = $derived(page.params.itemId);

	let list = $state<List | null | undefined>(undefined);
	let item = $state<Item | null | undefined>(undefined);

	let titleValue = $state('');
	let textValue = $state('');
	let iconValue = $state<string | undefined>(undefined);
	let emojiValue = $state<string | undefined>(undefined);
	let imageValue = $state<MediaRef | undefined>(undefined);
	let audioValue = $state<MediaRef | undefined>(undefined);
	let bgColorValue = $state<string | undefined>(undefined);
	let textColorValue = $state<string | undefined>(undefined);

	// Suppresses the fields-autosave effect while `load()` is populating the form (and for
	// the one effect run that follows), so loading an item doesn't immediately "save" it
	// back to itself. See the $effect below.
	let suppressAutosave = true;

	async function load() {
		const lId = listId;
		const iId = itemId;
		if (!lId || !iId) return;
		list = (await q.getList(lId)) ?? null;
		item = (await q.getItem(iId)) ?? null;
		if (!item) return;

		// Populate the edit form from the freshly-loaded item.
		titleValue = item.title;
		const fields = readItemFields(item);
		textValue = fields.text;
		iconValue = fields.icon;
		emojiValue = fields.emoji;
		imageValue = fields.image;
		audioValue = fields.audio;
		bgColorValue = item.bgColor;
		textColorValue = item.textColor;

		await tick();
		suppressAutosave = false;
	}

	onMount(load);

	async function saveTitle(value: string) {
		if (!item) return;
		const title = value.trim();
		if (!title) return;
		await q.updateItem(item.id, { title });
		item = { ...item, title };
		toast.success('Item updated');
	}

	let fieldsSaveTimeout: ReturnType<typeof setTimeout> | undefined;

	// Text/Icon/Emoji/Image/Audio all autosave (debounced) — Title saves separately via
	// Rename's own onSave, since it has its own commit gesture (Enter/blur).
	$effect(() => {
		void textValue;
		void iconValue;
		void emojiValue;
		void imageValue;
		void audioValue;
		void bgColorValue;
		void textColorValue;
		if (suppressAutosave) return;
		// Read `item` untracked — saveFields/saveTitle reassign it after each save, and
		// tracking it here would make that reassignment re-trigger this same effect,
		// scheduling another save forever.
		if (untrack(() => !item)) return;
		clearTimeout(fieldsSaveTimeout);
		fieldsSaveTimeout = setTimeout(saveFields, 500);
	});

	async function saveFields() {
		if (!item) return;
		const fields = buildItemFields(
			{ text: textValue, icon: iconValue, emoji: emojiValue, image: imageValue, audio: audioValue },
			item.fields
		);
		const patch = { fields, bgColor: bgColorValue, textColor: textColorValue };
		await q.updateItem(item.id, patch);
		item = { ...item, ...patch };
		toast.success('Item updated');
	}

	const titleTextClass = $derived(
		bgColorValue || textColorValue
			? cn('rounded-full px-2.5 py-1', bgColorValue, textColorValue)
			: undefined
	);

	async function deleteItem() {
		if (!item || !listId) return;
		await q.softDeleteItem(item.id);
		toast.success(`Moved "${item.title}" to trash`);
		await goto(resolve('/lists/[id]', { id: listId }));
	}
</script>

{#if item === undefined || list === undefined}
	<p class="text-muted-foreground">Loading…</p>
{:else if item === null || list === null}
	<p class="text-muted-foreground">Item not found.</p>
{:else}
	<div class="space-y-6">
		<div>
			<Button
				href={resolve('/lists/[id]', { id: list.id })}
				variant="ghost"
				size="sm"
				class="mb-2 gap-1.5"
			>
				<ArrowLeftIcon class="size-4" />
				{list.name}
			</Button>
			<div class="flex items-start justify-between">
				<Rename
					this="h1"
					class="text-2xl font-semibold"
					textClass={titleTextClass}
					bind:value={titleValue}
					onSave={saveTitle}
					validate={(v) => v.trim().length > 0}
				/>
				<Button variant="destructive" size="sm" onclick={deleteItem} class="gap-1.5">
					<Trash2Icon class="size-4" />
					Trash
				</Button>
			</div>
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
{/if}
