<script lang="ts">
	import { tick, onMount } from 'svelte';
	import { TagsInput } from '$lib/components/ui/tags-input/index.js';
	import { getAllTagColors } from '$lib/db/queries';
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

	// Plain (non-$state) on purpose — see the identical pattern (and the phantom-autosave
	// bug it fixes) in lists/[id]/data-table-icon-cell.svelte.
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

<TagsInput bind:value {suggestions} placeholder="Add tag…" getTagColor={tagColor} />
