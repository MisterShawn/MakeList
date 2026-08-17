<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as MakeCard from '$lib/components/make-card/index.js';
	import MediaGrid from '$lib/components/MediaGrid.svelte';
	import ColorPill from '$lib/components/ColorPill.svelte';
	import * as q from '$lib/db/queries';
	import type { List, Activity, MediaAsset, TagColor } from '$lib/db/types';
	import { activityTypeLabel } from '$lib/activity-types';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import GamepadIcon from '@lucide/svelte/icons/gamepad-2';

	const tag = $derived(page.params.tag);

	let lists = $state<List[]>([]);
	let activities = $state<Activity[]>([]);
	let media = $state<MediaAsset[]>([]);
	let color = $state<TagColor | undefined>(undefined);
	let loaded = $state(false);

	async function load() {
		if (!tag) return;
		loaded = false;
		const result = await q.getTaggedEntities(tag);
		lists = result.lists;
		activities = result.activities;
		media = result.media;
		color = await q.getTagColor(tag);
		loaded = true;
	}

	onMount(load);
</script>

<div class="space-y-6">
	<div>
		<Button variant="ghost" size="sm" class="mb-2 gap-1.5" onclick={() => history.back()}>
			<ArrowLeftIcon class="size-4" />
			Back
		</Button>
		<h1 class="text-2xl font-semibold">
			Tag:
			<ColorPill bg={color?.bgColor} text={color?.textColor}>{tag}</ColorPill>
		</h1>
		<p class="text-muted-foreground">Everything tagged "{tag}".</p>
	</div>

	{#if !loaded}
		<p class="text-muted-foreground">Loading…</p>
	{:else if lists.length === 0 && activities.length === 0 && media.length === 0}
		<p class="text-muted-foreground">Nothing is tagged "{tag}" yet.</p>
	{:else}
		{#if lists.length > 0}
			<div class="space-y-3">
				<h2 class="text-lg font-medium">Lists</h2>
				<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{#each lists as list (list.id)}
						<MakeCard.Root href={resolve('/lists/[id]', { id: list.id })}>
							<Card.Header>
								<Card.Title>{list.name}</Card.Title>
								{#if list.description}
									<Card.Description class="truncate">{list.description}</Card.Description>
								{/if}
							</Card.Header>
						</MakeCard.Root>
					{/each}
				</div>
			</div>
		{/if}

		{#if activities.length > 0}
			<div class="space-y-3">
				<h2 class="text-lg font-medium">Activities</h2>
				<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{#each activities as activity (activity.id)}
						<MakeCard.Root href={resolve('/activities/[id]', { id: activity.id })}>
							<MakeCard.Menu icon={GamepadIcon} />
							<Card.Header class="pr-8">
								<Card.Title>{activity.name}</Card.Title>
								<Badge variant="secondary" class="mt-1">{activityTypeLabel(activity.type)}</Badge>
							</Card.Header>
						</MakeCard.Root>
					{/each}
				</div>
			</div>
		{/if}

		{#if media.length > 0}
			<div class="space-y-3">
				<h2 class="text-lg font-medium">Media</h2>
				<MediaGrid assets={media} />
			</div>
		{/if}
	{/if}
</div>
