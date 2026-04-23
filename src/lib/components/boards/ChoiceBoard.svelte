<script lang="ts">
	import type { Item, MediaAsset } from '$lib/db/schema';
	import { Button } from '$lib/components/ui/button';
	import { LayoutGrid, Trash2 } from 'lucide-svelte';
	import ResponsiveDialog from '$lib/components/ResponsiveDialog.svelte';
	import { contrastColor } from '$lib/utils';

	interface Props {
		items: Item[];
		list2Items: Item[];
		mediaMap: Map<number, MediaAsset>;
	}

	let { items, list2Items, mediaMap }: Props = $props();

	// ── State ─────────────────────────────────────────────────────────────────

	let selections = $state(new Map<number, Item>());
	let activeItemId = $state<number | null>(null);
	let pickerOpen = $state(false);

	$effect(() => {
		const _ = items;
		selections = new Map();
		activeItemId = null;
	});

	// ── Derived ───────────────────────────────────────────────────────────────

	const activeItem = $derived(items.find((i) => i.id === activeItemId) ?? null);
	const selectedCount = $derived(selections.size);

	// ── Actions ───────────────────────────────────────────────────────────────

	function openPicker(itemId: number) {
		activeItemId = itemId;
		pickerOpen = true;
	}

	function selectChoice(choice: Item) {
		if (activeItemId == null) return;
		const next = new Map(selections);
		next.set(activeItemId, choice);
		selections = next;
		pickerOpen = false;
		activeItemId = null;
	}

	function clearActive() {
		if (activeItemId == null) return;
		const next = new Map(selections);
		next.delete(activeItemId);
		selections = next;
		pickerOpen = false;
		activeItemId = null;
	}

	function clearAll() {
		selections = new Map();
	}

	// ── Media ─────────────────────────────────────────────────────────────────

	type MediaInfo =
		| { type: 'emoji'; hex: string }
		| { type: 'image'; asset: MediaAsset }
		| { type: 'audio'; asset: MediaAsset };

	function getMedia(item: Item): MediaInfo | null {
		if (item.emojiId) return { type: 'emoji', hex: item.emojiId };
		const imgId = item.mediaId ?? item.gifId;
		if (imgId != null) {
			const asset = mediaMap.get(imgId);
			if (asset) return { type: 'image', asset };
		}
		if (item.audioId != null) {
			const asset = mediaMap.get(item.audioId);
			if (asset) return { type: 'audio', asset };
		}
		return null;
	}
</script>

{#if list2Items.length === 0}
	<div class="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
		<LayoutGrid size={32} class="text-muted-foreground/40" />
		<p class="text-sm text-muted-foreground">
			This board needs a second list to work. Add one in the board settings.
		</p>
		</div>
{:else}
	<div class="flex flex-1 flex-col overflow-hidden">

		<!-- ── Toolbar ────────────────────────────────────────────────────────── -->
		<div class="flex items-center justify-between border-b border-border px-6 py-2">
			<span class="tabular-nums text-sm text-muted-foreground">
				{selectedCount} / {items.length} responded
			</span>
			<Button
				variant="ghost"
				size="sm"
				onclick={clearAll}
				disabled={selectedCount === 0}
				class="text-muted-foreground"
			>
				<Trash2 size={14} /> Clear all
			</Button>
		</div>

		<!-- ── Progress bar ───────────────────────────────────────────────────── -->
		<div class="h-0.5 bg-muted">
			<div
				class="h-full bg-primary transition-[width] duration-300"
				style="width: {items.length > 0 ? (selectedCount / items.length) * 100 : 0}%"
			></div>
		</div>

		<!-- ── List 1 grid ─────────────────────────────────────────────────────── -->
		<div class="grid grid-cols-2 gap-3 overflow-y-auto p-6 sm:grid-cols-3 lg:grid-cols-4">
			{#each items as item (item.id)}
				{@const selection = selections.get(item.id!)}
				{@const selMedia = selection ? getMedia(selection) : null}
				{@const ownMedia = getMedia(item)}

				<button
					type="button"
					onclick={() => openPicker(item.id!)}
					class="flex min-h-36 flex-col items-center justify-between gap-2 rounded-xl border p-4 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
						{selection
							? item.color ? 'border-primary/30 hover:opacity-90' : 'border-primary/30 bg-primary/5 hover:bg-primary/10'
							: item.color ? 'border-transparent hover:opacity-90' : 'border-border bg-card hover:bg-accent'}"
					style={item.color ? `background-color: ${item.color}; color: ${contrastColor(item.color)}` : ''}
				>
					{#if selection}
						<!-- Selection display -->
						<p class="w-full truncate text-left text-xs opacity-60">{item.text}</p>
						<div class="flex flex-1 flex-col items-center justify-center gap-1.5">
							{#if selMedia?.type === 'emoji'}
								<img src="/openmoji/{selMedia.hex.toUpperCase()}.svg" alt="" class="h-12 w-12" draggable="false" />
							{:else if selMedia?.type === 'image'}
								<img src={selMedia.asset.dataUrl} alt="" class="max-h-12 max-w-full object-contain" draggable="false" />
							{/if}
							<p class="text-sm font-medium leading-snug">{selection.text}</p>
							{#if selection.subtext}
								<p class="text-xs opacity-70">{selection.subtext}</p>
							{/if}
						</div>
					{:else}
						<!-- Unselected display -->
						<div class="flex flex-1 flex-col items-center justify-center gap-2">
							{#if ownMedia?.type === 'emoji'}
								<img src="/openmoji/{ownMedia.hex.toUpperCase()}.svg" alt="" class="h-10 w-10 opacity-70" draggable="false" />
							{:else if ownMedia?.type === 'image'}
								<img src={ownMedia.asset.dataUrl} alt="" class="max-h-10 max-w-full object-contain opacity-70" draggable="false" />
							{/if}
							<p class="text-sm font-medium">{item.text}</p>
						</div>
						<p class="text-xs opacity-50">tap to choose</p>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	<!-- ── List 2 picker dialog ───────────────────────────────────────────── -->
	<ResponsiveDialog
		bind:open={pickerOpen}
		title={activeItem ? activeItem.text : 'Choose'}
		class="max-w-lg"
	>
		{#snippet children()}
			<div class="grid grid-cols-3 gap-2 py-2 sm:grid-cols-4">
				{#each list2Items as choice (choice.id)}
					{@const media = getMedia(choice)}
					{@const isSelected = selections.get(activeItemId!) === choice || selections.get(activeItemId!)?.id === choice.id}
					<button
						type="button"
						onclick={() => selectChoice(choice)}
						class="flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
							{isSelected
								? 'border-primary bg-primary/10 text-primary'
								: 'border-border bg-card hover:bg-accent'}"
					>
						{#if media?.type === 'emoji'}
							<img src="/openmoji/{media.hex.toUpperCase()}.svg" alt="" class="h-9 w-9" draggable="false" />
						{:else if media?.type === 'image'}
							<img src={media.asset.dataUrl} alt="" class="h-9 w-9 object-contain" draggable="false" />
						{/if}
						<span class="line-clamp-2 leading-snug">{choice.text}</span>
					</button>
				{/each}
			</div>
		{/snippet}
		{#snippet footer()}
			{#if selections.has(activeItemId!)}
				<Button variant="outline" onclick={clearActive}>
					<Trash2 size={14} /> Clear
				</Button>
			{/if}
			<Button variant="outline" onclick={() => (pickerOpen = false)}>Cancel</Button>
		{/snippet}
	</ResponsiveDialog>
{/if}
