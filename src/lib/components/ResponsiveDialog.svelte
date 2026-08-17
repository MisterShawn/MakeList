<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { useMediaQuery } from '$lib/hooks/use-media-query.svelte';
	import { cn } from '$lib/utils.js';
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		title,
		description,
		children,
		footer,
		class: className,
		hideTitle = false
	}: {
		open?: boolean;
		title: string;
		description?: string;
		children: Snippet;
		footer?: Snippet;
		/** Applied to the dialog/drawer's content box — e.g. to widen it past the default
		 *  `sm:max-w-md` for content (like an image preview) that wants more room. */
		class?: string;
		/** Keeps `title` as the dialog's accessible name (still announced to screen
		 *  readers) but hides it visually — for callers that show it elsewhere themselves,
		 *  e.g. centered in the footer instead of the default top-left header spot. */
		hideTitle?: boolean;
	} = $props();

	const isDesktop = useMediaQuery('(min-width: 768px)');
</script>

{#if isDesktop.matches}
	<Dialog.Root bind:open>
		<Dialog.Content class={cn('max-h-[85vh] grid-rows-[auto_1fr_auto]', className)}>
			<Dialog.Header class={hideTitle && !description ? 'sr-only' : ''}>
				<Dialog.Title class={hideTitle ? 'sr-only' : ''}>{title}</Dialog.Title>
				{#if description}
					<Dialog.Description>{description}</Dialog.Description>
				{/if}
			</Dialog.Header>
			<div class="min-h-0 overflow-y-auto">
				{@render children()}
			</div>
			{#if footer}
				<Dialog.Footer>
					{@render footer()}
				</Dialog.Footer>
			{/if}
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open>
		<Drawer.Content class={className}>
			<Drawer.Header class={hideTitle && !description ? 'sr-only' : ''}>
				<Drawer.Title class={hideTitle ? 'sr-only' : ''}>{title}</Drawer.Title>
				{#if description}
					<Drawer.Description>{description}</Drawer.Description>
				{/if}
			</Drawer.Header>
			<div class="min-h-0 overflow-y-auto px-4 pb-4">
				{@render children()}
			</div>
			{#if footer}
				<Drawer.Footer>
					{@render footer()}
				</Drawer.Footer>
			{/if}
		</Drawer.Content>
	</Drawer.Root>
{/if}
