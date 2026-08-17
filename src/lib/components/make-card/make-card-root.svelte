<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { cn } from '$lib/utils.js';
	import type { Snippet } from 'svelte';
	import { setMakeCard } from './context.svelte.js';

	let {
		href,
		children,
		class: className
	}: {
		/**
		 * Every card navigates to its detail page as a whole clickable unit, for consistency.
		 * Omit for entities with no detail page (e.g. Media assets) — the card still shows
		 * hover state and its menu, it just isn't a link.
		 */
		href?: string;
		/**
		 * Compose the card body directly — shadcn's `Card.Header`/`Card.Content`/`Card.Footer`,
		 * a `MakeCard.Menu`, or any other markup, in whatever order you want. An `<img>` as the
		 * first child gets rounded top corners matching the card automatically (shadcn Card's
		 * built-in `first-child:img` styling).
		 */
		children: Snippet;
		class?: string;
	} = $props();

	const card = setMakeCard();
</script>

{#snippet cardBody()}
	<Card.Root
		class={cn('relative h-full transition-colors hover:bg-muted/50 has-[audio]:pt-0', className)}
	>
		{@render children()}
	</Card.Root>
{/snippet}

{#if href}
	<a
		{href}
		class="block"
		onmouseenter={() => (card.hovering = true)}
		onmouseleave={() => (card.hovering = false)}
		onfocusin={() => (card.hovering = true)}
		onfocusout={() => (card.hovering = false)}
	>
		{@render cardBody()}
	</a>
{:else}
	<div
		role="group"
		onmouseenter={() => (card.hovering = true)}
		onmouseleave={() => (card.hovering = false)}
		onfocusin={() => (card.hovering = true)}
		onfocusout={() => (card.hovering = false)}
	>
		{@render cardBody()}
	</div>
{/if}
