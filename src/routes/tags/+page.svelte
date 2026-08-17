<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as MakeCard from '$lib/components/make-card/index.js';
	import ColorPickerField from '$lib/components/ColorPickerField.svelte';
	import ColorPill from '$lib/components/ColorPill.svelte';
	import * as q from '$lib/db/queries';
	import type { TagSummary } from '$lib/db/queries';
	import type { TagColor } from '$lib/db/types';
	import TagIcon from '@lucide/svelte/icons/tag';

	let tags = $state<TagSummary[]>([]);
	let colors = $state<Record<string, TagColor>>({});
	let loaded = $state(false);
	let searchText = $state('');

	async function refresh() {
		tags = await q.listTagsWithCounts();
		colors = await q.getAllTagColors();
		loaded = true;
	}

	async function saveTagColor(tag: string, patch: { bgColor?: string; textColor?: string }) {
		await q.setTagColor(tag, patch);
		colors = await q.getAllTagColors();
	}

	onMount(refresh);

	const filteredTags = $derived(
		searchText.trim()
			? tags.filter((t) => t.tag.toLowerCase().includes(searchText.trim().toLowerCase()))
			: tags
	);

	function totalCount(t: TagSummary): number {
		return t.listCount + t.activityCount + t.mediaCount;
	}

	/** e.g. "3 lists, 1 activity, 2 media" — only the non-zero parts. */
	function breakdown(t: TagSummary): string {
		const parts: string[] = [];
		if (t.listCount > 0) parts.push(`${t.listCount} list${t.listCount === 1 ? '' : 's'}`);
		if (t.activityCount > 0) {
			parts.push(`${t.activityCount} activit${t.activityCount === 1 ? 'y' : 'ies'}`);
		}
		if (t.mediaCount > 0) parts.push(`${t.mediaCount} media`);
		return parts.join(', ');
	}
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-semibold">Tags</h1>
		<p class="text-muted-foreground">Browse lists, activities, and media by tag.</p>
	</div>

	{#if !loaded}
		<p class="text-muted-foreground">Loading…</p>
	{:else if tags.length === 0}
		<p class="text-muted-foreground">
			No tags yet. Add tags to a list, activity, or media file to get started.
		</p>
	{:else}
		<Input placeholder="Search tags…" bind:value={searchText} class="max-w-sm" />

		{#if filteredTags.length === 0}
			<p class="text-muted-foreground">No tags match "{searchText.trim()}".</p>
		{:else}
			<div class="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-4">
				{#each filteredTags as t (t.tag)}
					<MakeCard.Root href={resolve('/tags/[tag]', { tag: t.tag })}>
						<MakeCard.Menu icon={TagIcon}></MakeCard.Menu>
						<Card.Header>
							<Card.Title class="flex items-center gap-2">
								<ColorPill bg={colors[t.tag]?.bgColor} text={colors[t.tag]?.textColor}>
									<span class="truncate">{t.tag}</span>
								</ColorPill>
							</Card.Title>
							<Card.Description>{breakdown(t)}</Card.Description>
						</Card.Header>
						<Card.Footer class="flex items-center justify-between">
							<Badge variant="secondary">{totalCount(t)} total</Badge>
							<!-- eslint-disable-next-line svelte/no-static-element-interactions -->
							<div
							onclick={(e) => {
								e.stopPropagation();
								e.preventDefault();
							}}
							role="presentation"
						>
								<ColorPickerField
									bg={colors[t.tag]?.bgColor}
									text={colors[t.tag]?.textColor}
									placeholder="—"
									class="size-8"
									onSave={(patch) => saveTagColor(t.tag, patch)}
								/>
							</div>
						</Card.Footer>
					</MakeCard.Root>
				{/each}
			</div>
		{/if}
	{/if}
</div>
