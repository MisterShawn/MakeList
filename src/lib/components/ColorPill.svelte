<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { Snippet } from 'svelte';

	let {
		bg,
		text,
		class: className,
		children
	}: {
		/** Full Tailwind class, e.g. "bg-red-500". */
		bg?: string;
		/** Full Tailwind class, e.g. "text-red-500". */
		text?: string;
		class?: string;
		children: Snippet;
	} = $props();
</script>

{#if bg || text}
	<span class={cn('inline-flex items-center rounded-full px-2 py-0.5', bg, text, className)}>
		{@render children()}
	</span>
{:else}
	{@render children()}
{/if}
