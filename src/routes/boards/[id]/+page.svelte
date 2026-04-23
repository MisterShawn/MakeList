<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { getBoard, getItems, getMediaAsset } from '$lib/db/queries';
	import type { Board, Item, MediaAsset } from '$lib/db/schema';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import FlashcardBoard from '$lib/components/boards/FlashcardBoard.svelte';
	import MultipleChoiceBoard from '$lib/components/boards/MultipleChoiceBoard.svelte';
	import MatchingBoard from '$lib/components/boards/MatchingBoard.svelte';
	import MemoryBoard from '$lib/components/boards/MemoryBoard.svelte';
	import QuizBoard from '$lib/components/boards/QuizBoard.svelte';
	import ChoiceBoard from '$lib/components/boards/ChoiceBoard.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Pencil } from 'lucide-svelte';

	const boardId = Number(page.params.id);

	let board = $state<Board | null>(null);
	let items = $state<Item[]>([]);
	let list2Items = $state<Item[]>([]);
	let mediaMap = $state<Map<number, MediaAsset>>(new Map());
	let loading = $state(true);
	let notFound = $state(false);

	onMount(async () => {
		const b = await getBoard(boardId);
		if (!b || b.deletedAt) {
			notFound = true;
			loading = false;
			return;
		}
		board = b;

		const fetched = await Promise.all([
			getItems(b.listId),
			b.list2Id ? getItems(b.list2Id) : Promise.resolve([]),
		]);
		items = fetched[0];
		list2Items = fetched[1];

		const allItems = [...fetched[0], ...fetched[1]];
		const mediaIds = new Set<number>();
		for (const item of allItems) {
			if (item.mediaId != null) mediaIds.add(item.mediaId);
			if (item.gifId != null) mediaIds.add(item.gifId);
			if (item.audioId != null) mediaIds.add(item.audioId);
		}
		if (mediaIds.size > 0) {
			const assets = await Promise.all([...mediaIds].map((id) => getMediaAsset(id)));
			const map = new Map<number, MediaAsset>();
			for (const asset of assets) {
				if (asset) map.set(asset.id!, asset);
			}
			mediaMap = map;
		}

		loading = false;
	});
</script>

<svelte:head><title>{board?.name ?? 'Board'} — MakeList</title></svelte:head>

{#if loading}
	<p class="p-6 text-sm text-muted-foreground">Loading…</p>
{:else if notFound}
	<div class="flex flex-col items-center gap-3 p-12 text-center">
		<p class="text-muted-foreground">Board not found.</p>
		<a href="/boards" class="text-sm text-primary underline-offset-4 hover:underline">← Back to boards</a>
	</div>
{:else if board}
	<div class="flex h-full flex-col">
		<PageHeader crumbs={[{ label: 'Boards', href: '/boards' }, { label: board.name }]}>
			{#snippet actions()}
				<Button variant="outline" size="sm" href="/boards/{board!.id}/edit">
					<Pencil size={13} /> Edit
				</Button>
			{/snippet}
		</PageHeader>

		{#if board.type === 'flashcard'}
			<FlashcardBoard
				{items} {mediaMap}
				autoAdvance={(board.settings?.autoAdvance as boolean) ?? false}
				autoAdvanceDelay={(board.settings?.autoAdvanceDelay as number) ?? 1500}
			/>
		{:else if board.type === 'multiple-choice'}
			<MultipleChoiceBoard
				{items} {mediaMap}
				autoAdvance={(board.settings?.autoAdvance as boolean) ?? false}
				autoAdvanceDelay={(board.settings?.autoAdvanceDelay as number) ?? 1500}
			/>
		{:else if board.type === 'matching'}
			<MatchingBoard {items} {mediaMap} hideMatched={(board.settings?.hideMatched as boolean) ?? false} />
		{:else if board.type === 'memory'}
			<MemoryBoard {items} {mediaMap} />
		{:else if board.type === 'quiz'}
			<QuizBoard
				{items} {mediaMap}
				autoAdvance={(board.settings?.autoAdvance as boolean) ?? false}
				autoAdvanceDelay={(board.settings?.autoAdvanceDelay as number) ?? 1500}
			/>
		{:else if board.type === 'choice-board'}
			<ChoiceBoard {items} {list2Items} {mediaMap} />
		{:else}
			<div class="flex flex-1 flex-col items-center justify-center gap-2 p-12 text-center">
				<p class="text-sm font-medium capitalize">{board.type}</p>
				<p class="text-sm text-muted-foreground">This board type is coming soon.</p>
			</div>
		{/if}
	</div>
{/if}
