<script lang="ts">
	import { Label } from '$lib/components/ui/label/index.js';
	import Textarea from './ui/textarea/textarea.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import IconPicker from '$lib/components/IconPicker.svelte';
	import EmojiPicker from '$lib/components/EmojiPicker.svelte';
	import MediaFieldPicker from '$lib/components/MediaFieldPicker.svelte';
	import ColorPicker from '$lib/components/ColorPicker.svelte';
	import type { MediaRef } from '$lib/db/types';
	import XIcon from '@lucide/svelte/icons/x';

	let {
		text = $bindable(''),
		icon = $bindable<string | undefined>(undefined),
		emoji = $bindable<string | undefined>(undefined),
		image = $bindable<MediaRef | undefined>(undefined),
		audio = $bindable<MediaRef | undefined>(undefined),
		bgColor = $bindable<string | undefined>(undefined),
		textColor = $bindable<string | undefined>(undefined)
	}: {
		text?: string;
		icon?: string;
		emoji?: string;
		image?: MediaRef;
		audio?: MediaRef;
		bgColor?: string;
		textColor?: string;
	} = $props();
</script>

{#snippet buttonRemove(onclick: () => void)}
	<Button
		class="absolute -right-4 -bottom-4 size-1/4 rounded-full bg-red-500"
		type="button"
		size="icon-lg"
		{onclick}
	>
		<XIcon class="size-1/2" />
	</Button>
{/snippet}

<div class="space-y-1.5">
	<Label for="item-field-text">Text</Label>
	<Textarea id="item-field-text" bind:value={text} placeholder="Optional" />
</div>

<div class="grid grid-cols-2 justify-between gap-4 *:space-y-2 lg:grid-cols-5">
	<div>
		<div class="relative rounded-2xl border p-2">
			<IconPicker bind:value={icon} class="aspect-square size-full" />
			{#if icon}
				{@render buttonRemove(() => (icon = undefined))}
			{/if}
		</div>
		<Label class="justify-center">Icon</Label>
	</div>
	<div>
		<div class="relative rounded-2xl border p-2">
			<EmojiPicker bind:value={emoji} class="aspect-square size-full" />
			{#if emoji}
				{@render buttonRemove(() => (emoji = undefined))}
			{/if}
		</div>
		<Label class="justify-center">Emoji</Label>
	</div>
	<div>
		<div class="relative rounded-2xl border p-2">
			<MediaFieldPicker bind:value={image} kind="image" class="aspect-square size-full" />
			{#if image}
				{@render buttonRemove(() => (image = undefined))}
			{/if}
		</div>
		<Label class="justify-center">Image</Label>
	</div>
	<div>
		<div class="relative rounded-2xl border p-2">
			<MediaFieldPicker bind:value={audio} kind="audio" class="aspect-square size-full" />
			{#if audio}
				{@render buttonRemove(() => (audio = undefined))}
			{/if}
		</div>
		<Label class="justify-center">Audio</Label>
	</div>
	<div>
		<div class="relative rounded-2xl border p-2">
			<ColorPicker bind:bg={bgColor} bind:text={textColor} class="aspect-square size-full" />
			{#if bgColor || textColor}
				{@render buttonRemove(() => {
					bgColor = undefined;
					textColor = undefined;
				})}
			{/if}
		</div>
		<Label class="justify-center">Color</Label>
	</div>
</div>
