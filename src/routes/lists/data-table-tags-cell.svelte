<script lang="ts">
	import { tick, onMount } from 'svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { TagsInput } from '$lib/components/ui/tags-input/index.js';
	import { getAllTagColors } from '$lib/db/queries';
	import { cn } from '$lib/utils.js';
	import type { TagColor } from '$lib/db/types';

	let {
		value: initial,
		suggestions,
		onSave
	}: {
		value: string[];
		suggestions?: string[];
		onSave: (value: string[]) => void;
	} = $props();

	let value = $state(initial);
	let open = $state(false);

	// Plain (non-$state) on purpose — see the identical pattern (and the phantom-autosave
	// bug it fixes) in data-table-icon-cell.svelte.
	let ready = false;
	tick().then(() => (ready = true));

	$effect(() => {
		void value;
		if (!ready) return;
		onSave(value);
	});

	let colors = $state<Record<string, TagColor>>({});
	onMount(async () => {
		colors = await getAllTagColors();
	});

	function tagColor(tag: string) {
		const c = colors[tag];
		return c ? { bg: c.bgColor, text: c.textColor } : undefined;
	}
</script>

<!-- eslint-disable-next-line svelte/no-static-element-interactions -->
<div onclick={(e) => e.stopPropagation()} role="presentation">
	<Popover.Root bind:open>
		<Popover.Trigger
			class="block w-full min-w-32 rounded-md px-2 py-1 text-left transition-colors hover:bg-muted"
		>
			{#if value.length > 0}
				<div class="flex flex-wrap gap-1">
					{#each value as tag (tag)}
						<Badge variant="outline" class={cn('text-xs', tagColor(tag)?.bg, tagColor(tag)?.text)}>
							{tag}
						</Badge>
					{/each}
				</div>
			{:else}
				<span class="text-muted-foreground">—</span>
			{/if}
		</Popover.Trigger>
		<Popover.Content class="w-72" onclick={(e) => e.stopPropagation()}>
			<TagsInput bind:value {suggestions} placeholder="Add tag…" getTagColor={tagColor} />
		</Popover.Content>
	</Popover.Root>
</div>
