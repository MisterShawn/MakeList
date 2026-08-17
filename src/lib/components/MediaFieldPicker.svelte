<script lang="ts">
	import { onDestroy } from 'svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import FieldValue from '$lib/components/FieldValue.svelte';
	import {
		listActiveAssets,
		uploadImageAsset,
		uploadAudioAsset,
		importUrlAsset
	} from '$lib/db/queries';
	import type { MediaRef, MediaAsset, ImageField, AudioField } from '$lib/db/types';
	import ImageIcon from '@lucide/svelte/icons/image';
	import Music2Icon from '@lucide/svelte/icons/music-2';
	import XIcon from '@lucide/svelte/icons/x';

	let {
		value = $bindable<MediaRef | undefined>(undefined),
		kind,
		placeholder = `Pick ${kind}`,
		class: className
	}: {
		value?: MediaRef;
		/** Locks this picker to one asset kind — an item can have one image field and one audio field. */
		kind: 'image' | 'audio';
		placeholder?: string;
		/** No default size — the trigger fills whatever box you give it via this class. */
		class?: string;
	} = $props();

	let open = $state(false);
	let assets = $state<MediaAsset[]>([]);
	let loadingAssets = $state(false);
	let uploading = $state(false);
	let urlText = $state('');
	let importingUrl = $state(false);
	let urlError = $state<string | undefined>(undefined);
	let thumbUrls = $state<Record<string, string>>({});

	function revokeThumbs() {
		for (const url of Object.values(thumbUrls)) {
			if (url.startsWith('blob:')) URL.revokeObjectURL(url);
		}
	}

	function rebuildThumbs(list: MediaAsset[]) {
		revokeThumbs();
		const next: Record<string, string> = {};
		for (const asset of list) {
			if (asset.kind !== 'image') continue;
			const url =
				asset.sourceType === 'url'
					? asset.url
					: asset.blob
						? URL.createObjectURL(asset.blob)
						: undefined;
			if (url) next[asset.id] = url;
		}
		thumbUrls = next;
	}

	async function loadAssets() {
		loadingAssets = true;
		try {
			const list = await listActiveAssets(kind);
			assets = list;
			rebuildThumbs(list);
		} finally {
			loadingAssets = false;
		}
	}

	$effect(() => {
		if (open) loadAssets();
	});

	onDestroy(revokeThumbs);

	function selectAsset(asset: MediaAsset) {
		value = { source: 'asset', assetId: asset.id };
		open = false;
	}

	async function onFileChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		uploading = true;
		try {
			const asset = kind === 'image' ? await uploadImageAsset(file) : await uploadAudioAsset(file);
			value = { source: 'asset', assetId: asset.id };
			open = false;
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
			const asset = await importUrlAsset(kind, url);
			value = { source: 'asset', assetId: asset.id };
			urlText = '';
			open = false;
		} catch {
			urlError =
				"Couldn't fetch that URL — the site may block cross-origin access. Try downloading and uploading the file instead.";
		} finally {
			importingUrl = false;
		}
	}

	const hasContent = $derived(
		value?.source === 'asset' || (value?.source === 'url' && value.url.trim().length > 0)
	);
	const previewField = $derived<ImageField | AudioField | undefined>(
		value && hasContent ? { id: 'preview', type: kind, value } : undefined
	);
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon" class={className}>
				{#if previewField}
					{#if kind === 'image'}
						<!-- Fixed-size box: FieldValue's <img> fills its container via
						     aspect-square + size-full, which needs a bounded parent. -->
						<div class="*size-full size-full overflow-hidden rounded-xl">
							<FieldValue field={previewField} />
						</div>
					{:else}
						<!-- Static icon rather than FieldValue's playable <audio> control —
						     that control is itself a <button>, which can't nest in this one. -->
						<Music2Icon class="size-4 shrink-0 text-muted-foreground" />
					{/if}
				{:else}
					<span class="text-muted-foreground">{placeholder}</span>
				{/if}
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-80 p-0">
		{#if hasContent}
			<div class="border-b p-1">
				<Button
					variant="ghost"
					size="sm"
					class="w-full justify-start gap-2 text-muted-foreground"
					onclick={() => {
						value = undefined;
						open = false;
					}}
				>
					<XIcon class="size-4" />
					Clear
				</Button>
			</div>
		{/if}
		<Tabs.Root value="browse">
			<Tabs.List class="w-full">
				<Tabs.Trigger value="browse" class="flex-1">Browse</Tabs.Trigger>
				<Tabs.Trigger value="upload" class="flex-1">Upload</Tabs.Trigger>
				<Tabs.Trigger value="url" class="flex-1">URL</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="browse" class="p-0">
				<Command.Root>
					<Command.Input placeholder="Search {kind}..." />
					<Command.List class="max-h-64">
						{#if loadingAssets}
							<p class="p-3 text-sm text-muted-foreground">Loading…</p>
						{:else if assets.length === 0}
							<Command.Empty>No {kind} uploaded yet.</Command.Empty>
						{:else}
							<div class="grid grid-cols-4 gap-1 p-1">
								{#each assets as asset (asset.id)}
									<Command.Item
										value={`${asset.fileName ?? asset.kind} ${asset.id}`}
										class="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg p-1 [&>.cn-command-item-indicator]:hidden"
										onSelect={() => selectAsset(asset)}
									>
										{#if thumbUrls[asset.id]}
											<img
												src={thumbUrls[asset.id]}
												alt=""
												class="size-8 rounded-md object-cover"
											/>
										{:else if asset.kind === 'image'}
											<ImageIcon class="size-5 text-muted-foreground" />
										{:else}
											<Music2Icon class="size-5 text-muted-foreground" />
										{/if}
										<span class="w-full truncate text-center text-[10px] text-muted-foreground">
											{asset.fileName ?? asset.kind}
										</span>
									</Command.Item>
								{/each}
							</div>
						{/if}
					</Command.List>
				</Command.Root>
			</Tabs.Content>
			<Tabs.Content value="upload" class="space-y-2 p-3">
				<Input
					type="file"
					accept={kind === 'image' ? 'image/*' : 'audio/*'}
					onchange={onFileChange}
				/>
				{#if uploading}
					<p class="text-xs text-muted-foreground">Uploading…</p>
				{/if}
			</Tabs.Content>
			<Tabs.Content value="url" class="space-y-2 p-3">
				<Input
					type="url"
					placeholder="https://…"
					bind:value={urlText}
					oninput={() => (urlError = undefined)}
				/>
				{#if urlError}
					<p class="text-xs text-destructive">{urlError}</p>
				{/if}
				<Button
					type="button"
					size="sm"
					class="w-full"
					disabled={!urlText.trim() || importingUrl}
					onclick={addUrlAsset}
				>
					{importingUrl ? 'Importing…' : 'Add'}
				</Button>
			</Tabs.Content>
		</Tabs.Root>
	</Popover.Content>
</Popover.Root>
