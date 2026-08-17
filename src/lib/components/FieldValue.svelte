<script lang="ts">
	import { onDestroy } from 'svelte';
	import { ALL_ICONS } from '$lib/data/icon-data';
	import { resolveFieldMedia, resolveMediaField } from '$lib/db/queries';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import type { ItemField } from '$lib/db/types';
	import PlayIcon from '@lucide/svelte/icons/play';
	import PauseIcon from '@lucide/svelte/icons/pause';
	import ImageOffIcon from '@lucide/svelte/icons/image-off';
	import VolumeXIcon from '@lucide/svelte/icons/volume-x';

	let {
		field,
		onImageClick
	}: {
		field: ItemField;
		/** When set, makes an 'image' field's <img> clickable — applied directly to the
		 *  <img> itself (not a wrapping element) so it stays a card's literal first child,
		 *  which Card.Root's `has-[>img:first-child]`/`*:[img:first-child]` styling depends on. */
		onImageClick?: () => void;
	} = $props();

	function onImageKeydown(e: KeyboardEvent) {
		if (e.key !== 'Enter' && e.key !== ' ') return;
		e.preventDefault();
		onImageClick?.();
	}

	const iconEntry = $derived(
		field.type === 'icon' ? ALL_ICONS.find((i) => i.name === field.value) : undefined
	);

	let mediaUrl = $state<string | undefined>(undefined);
	let mediaKind = $state<'image' | 'audio' | undefined>(undefined);
	// Distinguishes "still resolving" from "resolved to nothing" — without it, a field
	// whose asset was deleted looks identical to one that just hasn't loaded yet, and
	// gets stuck showing "Loading…" forever instead of a missing-media state.
	let resolving = $state(true);
	let objectUrlToRevoke: string | undefined;

	let audioEl = $state<HTMLAudioElement | undefined>(undefined);
	let playing = $state(false);

	function togglePlay() {
		if (!audioEl) return;
		if (playing) audioEl.pause();
		else audioEl.play();
	}

	$effect(() => {
		if (field.type === 'image' || field.type === 'audio') {
			const currentField = field;
			mediaKind = currentField.type;
			resolving = true;
			resolveFieldMedia(currentField).then((url) => {
				mediaUrl = url;
				resolving = false;
				if (url?.startsWith('blob:')) objectUrlToRevoke = url;
			});
		} else if (field.type === 'media') {
			const currentField = field;
			resolving = true;
			resolveMediaField(currentField).then((resolved) => {
				mediaUrl = resolved?.url;
				mediaKind = resolved?.kind;
				resolving = false;
				if (resolved?.url.startsWith('blob:')) objectUrlToRevoke = resolved.url;
			});
		} else {
			mediaUrl = undefined;
			mediaKind = undefined;
		}
	});

	onDestroy(() => {
		if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
	});
</script>

{#if field.type === 'text'}
	<span>{field.value}</span>
{:else if field.type === 'emoji'}
	<span class="text-base leading-none">{field.value}</span>
{:else if field.type === 'icon'}
	{#if iconEntry}
		<iconEntry.icon />
	{:else}
		<span class="text-muted-foreground">{field.value}</span>
	{/if}
{:else if field.type === 'image' || (field.type === 'media' && mediaKind === 'image')}
	{#if mediaUrl}
		<!-- role and tabindex are always set together, driven by the same onImageClick check -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<img
			src={mediaUrl}
			alt={field.label ?? 'Image'}
			class={cn(
				'aspect-square size-full object-cover hover:opacity-80',
				onImageClick && 'cursor-zoom-in'
			)}
			role={onImageClick ? 'button' : undefined}
			tabindex={onImageClick ? 0 : undefined}
			onclick={onImageClick}
			onkeydown={onImageClick ? onImageKeydown : undefined}
		/>
	{:else if resolving}
		<span class="text-muted-foreground">Loading image…</span>
	{:else}
		<span
			class="flex aspect-square size-full flex-col items-center justify-center gap-1 text-muted-foreground"
			title="This image was deleted from Media."
		>
			<ImageOffIcon class="size-[35%]" />
		</span>
	{/if}
{:else if field.type === 'audio' || (field.type === 'media' && mediaKind === 'audio')}
	{#if mediaUrl}
		<div class="flex aspect-square size-full items-center justify-center bg-primary">
			<audio
				bind:this={audioEl}
				src={mediaUrl}
				onplay={() => (playing = true)}
				onpause={() => (playing = false)}
				onended={() => (playing = false)}
				class="hidden"
			></audio>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				onclick={togglePlay}
				class="size-full cursor-pointer text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
			>
				{#if playing}
					<PauseIcon class="size-[50%]" />
				{:else}
					<PlayIcon class="size-[50%]" />
				{/if}
			</Button>
		</div>
	{:else if resolving}
		<span class="text-muted-foreground">Loading audio…</span>
	{:else}
		<span
			class="flex aspect-square size-full flex-col items-center justify-center gap-1 text-muted-foreground"
			title="This audio was deleted from Media."
		>
			<VolumeXIcon class="size-[35%]" />
		</span>
	{/if}
{/if}
