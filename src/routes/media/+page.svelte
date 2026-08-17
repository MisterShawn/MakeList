<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import ResponsiveDialog from '$lib/components/ResponsiveDialog.svelte';
	import MediaGrid from '$lib/components/MediaGrid.svelte';
	import MediaTagsField from '$lib/components/MediaTagsField.svelte';
	import * as FileDropZone from '$lib/components/ui/file-drop-zone/index.js';
	import { cn } from '$lib/utils.js';
	import {
		listActiveAssets,
		uploadImageAsset,
		uploadAudioAsset,
		importUrlAsset,
		softDeleteAsset,
		getAssetUsage,
		updateAsset,
		listAllTags
	} from '$lib/db/queries';
	import type { MediaAsset } from '$lib/db/types';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-down';

	let assets = $state<MediaAsset[]>([]);
	let usageCounts = $state<Record<string, number>>({});
	let tagSuggestions = $state<string[]>([]);
	let searchText = $state('');
	let kindFilter = $state<'all' | 'image' | 'audio'>('all');

	let dialogOpen = $state(false);
	let nameText = $state('');
	let uploading = $state(false);
	let urlText = $state('');
	let importingUrl = $state(false);
	let urlError = $state<string | undefined>(undefined);

	// Every card's Collapsible binds to this same variable, so opening/closing one opens/closes them all.
	let allDetailsOpen = $state(false);

	const AUDIO_EXT_RE = /\.(mp3|wav|ogg|m4a|flac|aac)(\?|#|$)/i;
	/** No recognizable audio extension is treated as an image — covers both actual images and extension-less URLs. */
	const urlKind = $derived<'image' | 'audio'>(AUDIO_EXT_RE.test(urlText) ? 'audio' : 'image');

	async function refresh() {
		assets = await listActiveAssets();
		const counts: Record<string, number> = {};
		await Promise.all(
			assets.map(async (a) => {
				counts[a.id] = (await getAssetUsage(a.id)).length;
			})
		);
		usageCounts = counts;
		tagSuggestions = await listAllTags();
	}

	onMount(refresh);

	async function saveAssetTags(asset: MediaAsset, tags: string[]) {
		await updateAsset(asset.id, { tags });
		await refresh();
	}

	const filteredAssets = $derived(
		assets.filter((a) => {
			if (kindFilter !== 'all' && a.kind !== kindFilter) return false;
			if (!searchText.trim()) return true;
			return (a.fileName ?? a.url ?? '').toLowerCase().includes(searchText.trim().toLowerCase());
		})
	);

	function formatBytes(bytes?: number): string {
		if (!bytes) return '';
		const units = ['B', 'KB', 'MB', 'GB'];
		let value = bytes;
		let unitIndex = 0;
		while (value >= 1024 && unitIndex < units.length - 1) {
			value /= 1024;
			unitIndex++;
		}
		return `${value.toFixed(value < 10 && unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
	}

	/** Upper-cased file extension for the kind badge, e.g. "photo.png" -> "PNG". Falls back to the asset's kind when there's no extension to show. */
	function badgeLabel(asset: MediaAsset): string {
		const name = asset.fileName;
		const dotIndex = name?.lastIndexOf('.') ?? -1;
		if (name && dotIndex > 0 && dotIndex < name.length - 1) {
			return name.slice(dotIndex + 1).toUpperCase();
		}
		return asset.kind;
	}

	async function onFilesDropped(files: File[]) {
		const file = files[0];
		if (!file) return;
		uploading = true;
		try {
			const name = nameText.trim() || undefined;
			if (file.type.startsWith('image/')) await uploadImageAsset(file, name);
			else await uploadAudioAsset(file, name);
			toast.success('Uploaded');
			nameText = '';
			dialogOpen = false;
			await refresh();
		} finally {
			uploading = false;
		}
	}

	async function addUrlAsset() {
		const url = urlText.trim();
		if (!url) return;
		importingUrl = true;
		urlError = undefined;
		try {
			await importUrlAsset(urlKind, url, nameText.trim() || undefined);
			toast.success('Added');
			urlText = '';
			nameText = '';
			dialogOpen = false;
			await refresh();
		} catch {
			urlError =
				"Couldn't fetch that URL — the site may block cross-origin access. Try downloading and uploading the file instead.";
		} finally {
			importingUrl = false;
		}
	}

	async function deleteAsset(asset: MediaAsset) {
		await softDeleteAsset(asset.id);
		toast.success('Moved to trash');
		await refresh();
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-semibold">Media</h1>
			<p class="text-muted-foreground">Every uploaded image and audio file, shared across items.</p>
		</div>
		<Button onclick={() => (dialogOpen = true)} class="gap-1.5">
			<PlusIcon class="size-4" />
			Upload
		</Button>
	</div>

	{#if assets.length === 0}
		<p class="text-muted-foreground">No media yet. Upload a file to get started.</p>
	{:else}
		<div class="flex flex-wrap items-center gap-2">
			<Input placeholder="Search media…" bind:value={searchText} class="max-w-sm" />
			<ToggleGroup.Root
				type="single"
				value={kindFilter}
				onValueChange={(v) => v && (kindFilter = v as 'all' | 'image' | 'audio')}
				variant="outline"
			>
				<ToggleGroup.Item value="all">All</ToggleGroup.Item>
				<ToggleGroup.Item value="image">Image</ToggleGroup.Item>
				<ToggleGroup.Item value="audio">Audio</ToggleGroup.Item>
			</ToggleGroup.Root>
		</div>

		{#if filteredAssets.length === 0}
			<p class="text-muted-foreground">No media matches "{searchText.trim()}".</p>
		{:else}
			<MediaGrid assets={filteredAssets} {cardMenuItems} {cardFooter} />
		{/if}
	{/if}
</div>

{#snippet cardMenuItems(asset: MediaAsset)}
	<DropdownMenu.Item variant="destructive" onclick={() => deleteAsset(asset)}>
		<Trash2Icon class="size-4" />
		Trash
	</DropdownMenu.Item>
{/snippet}

{#snippet cardFooter(asset: MediaAsset)}
	<Collapsible.Root bind:open={allDetailsOpen} class="w-full">
		<Collapsible.Trigger
			class="flex w-full cursor-pointer justify-center gap-1 py-2 text-sm text-muted-foreground hover:text-foreground"
		>
			<ChevronRightIcon class={cn('size-4 transition-transform', allDetailsOpen && 'rotate-180')} />
		</Collapsible.Trigger>
		<Collapsible.Content
			class="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down"
		>
			<div class="grid gap-1 pb-4 text-xs text-muted-foreground">
				<div class="flex justify-between">
					<span>File Size:</span>
					{#if (asset.size ?? 0) > 500000}
						<Badge variant="secondary" class="bg-destructive text-xs">{formatBytes(asset.size)}</Badge>
					{:else if (asset.size ?? 0) > 100000 && (asset.size ?? 0) < 499999}
						<Badge variant="secondary" class="bg-warning text-xs">{formatBytes(asset.size)}</Badge>
					{:else}
						<Badge variant="secondary" class="text-xs">{formatBytes(asset.size)}</Badge>
					{/if}
				</div>
				<div class="flex justify-between">
					<span>File Type:</span>
					<Badge variant="secondary" class="text-xs">{badgeLabel(asset)}</Badge>
				</div>
				<div class="flex justify-between">
					<span>Used by:</span>
					<Badge variant="secondary" class="text-xs"
						>{usageCounts[asset.id]} item{usageCounts[asset.id] === 1 ? '' : 's'}</Badge
					>
				</div>
				<MediaTagsField
					value={asset.tags ?? []}
					suggestions={tagSuggestions}
					onSave={(tags) => saveAssetTags(asset, tags)}
				/>
			</div>
		</Collapsible.Content>
	</Collapsible.Root>
{/snippet}

<ResponsiveDialog bind:open={dialogOpen} title="Upload media">
	<div class="space-y-4">
		<div class="space-y-1.5">
			<Label for="media-upload-name">Name (optional)</Label>
			<Input id="media-upload-name" bind:value={nameText} placeholder="e.g. Golden Retriever" />
			<p class="text-xs text-muted-foreground">Defaults to the file name.</p>
		</div>
		<div class="space-y-1.5">
			<Label for="media-upload-file">Upload a file</Label>
			<FileDropZone.Root
				id="media-upload-file"
				accept="image/*,audio/*"
				maxFiles={1}
				fileCount={0}
				disabled={uploading}
				onUpload={onFilesDropped}
			>
				<FileDropZone.Trigger />
			</FileDropZone.Root>
			{#if uploading}
				<p class="text-xs text-muted-foreground">Uploading…</p>
			{/if}
		</div>
		<div class="space-y-1.5">
			<Label for="media-upload-url">Or add by URL</Label>
			<Input
				id="media-upload-url"
				type="url"
				placeholder="https://…"
				bind:value={urlText}
				oninput={() => (urlError = undefined)}
			/>
			{#if urlError}
				<p class="text-xs text-destructive">{urlError}</p>
			{:else if urlText.trim()}
				<p class="text-xs text-muted-foreground">
					Detected as {urlKind === 'audio' ? 'audio' : 'image'}
				</p>
			{/if}
			<Button
				type="button"
				class="w-full"
				disabled={!urlText.trim() || importingUrl}
				onclick={addUrlAsset}
			>
				{importingUrl ? 'Importing…' : 'Add'}
			</Button>
		</div>
	</div>
</ResponsiveDialog>
