<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import MoreVerticalIcon from '@lucide/svelte/icons/more-vertical';
	import type { Component, Snippet } from 'svelte';
	import { useMakeCard } from './context.svelte.js';

	let {
		icon,
		leading,
		menuItems
	}: {
		/** Simple icon shown when not hovering/open. Ignored if `leading` is also given. */
		icon?: Component;
		/** Custom visual (e.g. an avatar) in place of `icon`. */
		leading?: Snippet;
		/** Dropdown menu items. Presence enables the hover/focus/open-triggered icon-to-menu swap. */
		menuItems?: Snippet;
	} = $props();

	const card = useMakeCard();

	// Menu-open takes priority so the trigger icon doesn't revert mid-interaction —
	// e.g. once the dropdown content opens, the pointer is often no longer over the card.
	const showMenuIcon = $derived(!!menuItems && (card.hovering || card.menuOpen));
</script>

{#snippet leadingVisual()}
	{#if leading}
		{@render leading()}
	{:else if icon}
		{@const Icon = icon}
		<Icon class="text-muted-foreground" />
	{/if}
{/snippet}

<!-- Self-positioned so it always ends up in the corner regardless of where it's rendered
     in the caller's markup — reserve space (e.g. `class="pr-8"` on Card.Header) so title
     text doesn't run underneath it. -->
<div class="absolute top-2 right-2 z-10">
	{#if menuItems}
		<DropdownMenu.Root bind:open={card.menuOpen}>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button {...props} variant="ghost" size="icon-sm" class="shrink-0">
						{#if showMenuIcon}
							<MoreVerticalIcon class="size-4" />
						{:else}
							{@render leadingVisual()}
						{/if}
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				{@render menuItems()}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	{:else}
		<div class="flex size-7 shrink-0 items-center justify-center">
			{@render leadingVisual()}
		</div>
	{/if}
</div>
