<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { getAllTagColors } from '$lib/db/queries';
	import { cn } from '$lib/utils.js';
	import type { TagColor } from '$lib/db/types';

	// Plain buttons (not <a>) — this often renders inside MakeCard's own <a href> wrapper,
	// where a nested anchor would be invalid HTML and unreliable to click.
	let { tags }: { tags: string[] } = $props();

	let colors = $state<Record<string, TagColor>>({});
	onMount(async () => {
		colors = await getAllTagColors();
	});
</script>

{#if tags.length > 0}
	<div class="flex flex-wrap gap-1.5">
		{#each tags as tag (tag)}
			{@const color = colors[tag]}
			<button
				type="button"
				onclick={(e) => {
					e.stopPropagation();
					e.preventDefault();
					goto(resolve('/tags/[tag]', { tag }));
				}}
			>
				<Badge
					variant="outline"
					class={cn('hover:opacity-80', color?.bgColor, color?.textColor)}
				>
					{tag}
				</Badge>
			</button>
		{/each}
	</div>
{/if}
