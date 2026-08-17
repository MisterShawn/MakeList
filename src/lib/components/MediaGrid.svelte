<script lang="ts">
	import { onDestroy } from 'svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as MakeCard from '$lib/components/make-card/index.js';
	import ResponsiveDialog from '$lib/components/ResponsiveDialog.svelte';
	import FieldValue from '$lib/components/FieldValue.svelte';
	import { resolveFieldMedia } from '$lib/db/queries';
	import { cn } from '$lib/utils.js';
	import type { MediaAsset, ImageField, AudioField } from '$lib/db/types';
	import type { Snippet } from 'svelte';
	import ImageIcon from '@lucide/svelte/icons/image';
	import AudioLinesIcon from '@lucide/svelte/icons/audio-lines';

	let {
		assets,
		class: className,
		cardMenuItems,
		cardFooter
	}: {
		assets: MediaAsset[];
		/** Applied to the grid container — override to change column sizing/gap. */
		class?: string;
		/** Extra dropdown-menu items per card (e.g. a Trash action). Omit for a plain
		 *  kind-icon with no dropdown, matching MakeCard.Menu's own behavior. */
		cardMenuItems?: Snippet<[MediaAsset]>;
		/** Extra content rendered in a Card.Footer below the title, per card. */
		cardFooter?: Snippet<[MediaAsset]>;
	} = $props();

	function fieldForAsset(asset: MediaAsset): ImageField | AudioField {
		return { id: asset.id, type: asset.kind, value: { source: 'asset', assetId: asset.id } };
	}

	/** File name with its extension stripped, e.g. "photo.png" -> "photo". */
	function baseFileName(asset: MediaAsset): string {
		const name = asset.fileName;
		if (!name) return asset.url ?? 'Untitled';
		const dotIndex = name.lastIndexOf('.');
		return dotIndex > 0 ? name.slice(0, dotIndex) : name;
	}

	let previewOpen = $state(false);
	let previewAsset = $state<MediaAsset | undefined>(undefined);
	let previewUrl = $state<string | undefined>(undefined);
	let previewObjectUrl: string | undefined;

	function revokePreviewUrl() {
		if (previewObjectUrl) {
			URL.revokeObjectURL(previewObjectUrl);
			previewObjectUrl = undefined;
		}
	}

	// Deliberately doesn't react to `previewOpen` going false — the dialog's close
	// animation keeps it visible for a beat, and clearing previewAsset/previewUrl right
	// away made the image vanish (and the dialog shrink to the "Loading…" fallback)
	// mid-animation. Left showing the last image is not a page tear or memory issue: the
	// blob URL is revoked here, at the start of the *next* preview, or on destroy.
	async function openPreview(asset: MediaAsset) {
		revokePreviewUrl();
		previewAsset = asset;
		previewUrl = undefined;
		previewOpen = true;
		const url = await resolveFieldMedia(fieldForAsset(asset));
		if (previewAsset !== asset) return;
		previewUrl = url;
		if (url?.startsWith('blob:')) previewObjectUrl = url;
	}

	onDestroy(revokePreviewUrl);
</script>

<div class={cn('grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-4', className)}>
	{#each assets as asset (asset.id)}
		<MakeCard.Root class={cn('gap-4', cardFooter && 'pb-0')}>
			<FieldValue
				field={fieldForAsset(asset)}
				onImageClick={asset.kind === 'image' ? () => openPreview(asset) : undefined}
			/>
			{#if cardMenuItems}
				<MakeCard.Menu icon={asset.kind === 'image' ? ImageIcon : AudioLinesIcon}>
					{#snippet menuItems()}
						{@render cardMenuItems(asset)}
					{/snippet}
				</MakeCard.Menu>
			{:else}
				<MakeCard.Menu icon={asset.kind === 'image' ? ImageIcon : AudioLinesIcon} />
			{/if}
			<Card.Header class="rounded-none">
				<Card.Title class="truncate text-center text-sm">
					{baseFileName(asset)}
				</Card.Title>
			</Card.Header>
			{#if cardFooter}
				<Card.Footer class="rounded-none border-t bg-accent [.border-t]:pt-0">
					{@render cardFooter(asset)}
				</Card.Footer>
			{/if}
		</MakeCard.Root>
	{/each}
</div>

<ResponsiveDialog
	bind:open={previewOpen}
	title={previewAsset ? baseFileName(previewAsset) : ''}
	class="sm:max-w-3xl"
	hideTitle
>
	{#if previewUrl}
		<img
			src={previewUrl}
			alt={previewAsset ? baseFileName(previewAsset) : ''}
			class="max-h-[75vh] w-full rounded-xl object-contain"
		/>
	{:else}
		<p class="text-muted-foreground">Loading…</p>
	{/if}
	{#snippet footer()}
		<p class="w-full text-center text-sm text-muted-foreground">
			{previewAsset ? baseFileName(previewAsset) : ''}
		</p>
	{/snippet}
</ResponsiveDialog>
