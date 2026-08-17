<script lang="ts">
	import { untrack } from 'svelte';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import FieldValue from '$lib/components/FieldValue.svelte';
	import { resolveFieldForType, isTitleField, shuffle } from '$lib/activity-runtime';
	import { cn } from '$lib/utils.js';
	import type { Item, MemoryConfig, MemoryDetail, ItemField } from '$lib/db/types';

	let {
		items,
		config,
		onComplete
	}: {
		items: Item[];
		config: MemoryConfig;
		onComplete: (result: { score: number; total: number; detail: MemoryDetail }) => void;
	} = $props();

	interface Card {
		cardId: string;
		itemId: string;
		item: Item;
		field: ItemField;
	}

	const pairCount = $state(untrack(() => Math.min(config.gridPairs ?? 6, items.length)));
	const roundItems = $state(untrack(() => shuffle(items).slice(0, pairCount)));
	const cards: Card[] = shuffle(
		roundItems.flatMap((item) => [
			{
				cardId: `${item.id}-a`,
				itemId: item.id,
				item,
				field: resolveFieldForType(item, config.fieldKeyA)
			},
			{
				cardId: `${item.id}-b`,
				itemId: item.id,
				item,
				field: resolveFieldForType(item, config.fieldKeyB ?? config.fieldKeyA)
			}
		])
	);

	let flipped = $state<string[]>([]);
	let matchedItemIds = $state<Set<string>>(new Set());
	let moves = $state(0);
	const startedAt = Date.now();

	function flip(card: Card) {
		if (flipped.includes(card.cardId) || matchedItemIds.has(card.itemId) || flipped.length >= 2)
			return;
		flipped = [...flipped, card.cardId];
		if (flipped.length === 2) {
			moves += 1;
			const [firstId, secondId] = flipped;
			const first = cards.find((c) => c.cardId === firstId)!;
			const second = cards.find((c) => c.cardId === secondId)!;
			if (first.itemId === second.itemId) {
				matchedItemIds = new Set([...matchedItemIds, first.itemId]);
				flipped = [];
				if (matchedItemIds.size === roundItems.length) {
					onComplete({
						score: matchedItemIds.size,
						total: roundItems.length,
						detail: {
							type: 'memory',
							moves,
							matchedPairs: matchedItemIds.size,
							timeMs: Date.now() - startedAt
						}
					});
				}
			} else {
				setTimeout(() => (flipped = []), 700);
			}
		}
	}
</script>

<div class="mx-auto max-w-2xl space-y-4">
	<Progress value={(matchedItemIds.size / roundItems.length) * 100} />
	<p class="text-center text-sm text-muted-foreground">
		{matchedItemIds.size} / {roundItems.length} pairs · {moves} moves
	</p>

	<div class="grid grid-cols-4 gap-2">
		{#each cards as card (card.cardId)}
			{@const isFlipped = flipped.includes(card.cardId) || matchedItemIds.has(card.itemId)}
			{@const isMatched = matchedItemIds.has(card.itemId)}
			{@const revealColor =
				isTitleField(card.item, card.field) && (card.item.bgColor || card.item.textColor)
					? cn(card.item.bgColor, card.item.textColor)
					: undefined}
			<button
				type="button"
				onclick={() => flip(card)}
				disabled={isMatched}
				class={cn(
					'flex aspect-square items-center justify-center rounded-2xl border p-2 text-center transition-colors',
					isMatched ? 'border-green-500 bg-green-500/10 opacity-50' : 'border-border',
					isFlipped && !isMatched && (revealColor ?? 'bg-muted'),
					!isFlipped && 'bg-card hover:bg-muted'
				)}
			>
				{#if isFlipped}
					<FieldValue field={card.field} />
				{:else}
					<span class="text-lg text-muted-foreground">?</span>
				{/if}
			</button>
		{/each}
	</div>
</div>
