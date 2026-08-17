<script lang="ts">
	import { untrack } from 'svelte';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import FieldValue from '$lib/components/FieldValue.svelte';
	import { resolveFieldForType, isTitleField, shuffle } from '$lib/activity-runtime';
	import { cn } from '$lib/utils.js';
	import type { Item, ItemField, MatchingConfig, MatchingDetail } from '$lib/db/types';

	/** Only colorizes the idle state — matched/wrong/selected feedback always wins. */
	function tileColorFor(item: Item, field: ItemField): string | undefined {
		return isTitleField(item, field) && (item.bgColor || item.textColor)
			? cn(item.bgColor, item.textColor)
			: undefined;
	}

	let {
		items,
		config,
		onComplete
	}: {
		items: Item[];
		config: MatchingConfig;
		onComplete: (result: { score: number; total: number; detail: MatchingDetail }) => void;
	} = $props();

	const pairCount = $state(untrack(() => Math.min(config.pairsPerRound ?? 6, items.length)));
	const roundItems = $state(untrack(() => shuffle(items).slice(0, pairCount)));
	const leftOrder = $state(shuffle(roundItems));
	const rightOrder = $state(shuffle(roundItems));

	let selectedLeft = $state<string | undefined>(undefined);
	let selectedRight = $state<string | undefined>(undefined);
	let matchedIds = $state<Set<string>>(new Set());
	let wrongPair = $state<{ left: string; right: string } | undefined>(undefined);
	let pairStartedAt = Date.now();
	const entries: MatchingDetail['entries'] = [];

	function pickLeft(id: string) {
		if (matchedIds.has(id) || wrongPair) return;
		selectedLeft = id;
		tryMatch();
	}

	function pickRight(id: string) {
		if (matchedIds.has(id) || wrongPair) return;
		selectedRight = id;
		tryMatch();
	}

	function tryMatch() {
		if (!selectedLeft || !selectedRight) return;
		const timeMs = Date.now() - pairStartedAt;
		if (selectedLeft === selectedRight) {
			entries.push({ leftItemId: selectedLeft, rightItemId: selectedRight, correct: true, timeMs });
			matchedIds = new Set([...matchedIds, selectedLeft]);
			selectedLeft = undefined;
			selectedRight = undefined;
			pairStartedAt = Date.now();
			if (matchedIds.size === roundItems.length) {
				onComplete({
					score: roundItems.length,
					total: roundItems.length,
					detail: { type: 'matching', entries }
				});
			}
		} else {
			entries.push({
				leftItemId: selectedLeft,
				rightItemId: selectedRight,
				correct: false,
				timeMs
			});
			wrongPair = { left: selectedLeft, right: selectedRight };
			setTimeout(() => {
				wrongPair = undefined;
				selectedLeft = undefined;
				selectedRight = undefined;
				pairStartedAt = Date.now();
			}, 600);
		}
	}
</script>

<div class="mx-auto max-w-2xl space-y-4">
	<Progress value={(matchedIds.size / roundItems.length) * 100} />
	<p class="text-center text-sm text-muted-foreground">
		{matchedIds.size} / {roundItems.length} matched
	</p>

	<div class="grid grid-cols-2 gap-6">
		<div class="space-y-2">
			{#each leftOrder as item (item.id)}
				{@const field = resolveFieldForType(item, config.leftFieldKey)}
				{@const matched = matchedIds.has(item.id)}
				{@const tileColor = tileColorFor(item, field)}
				<button
					type="button"
					onclick={() => pickLeft(item.id)}
					disabled={matched}
					class={cn(
						'flex min-h-12 w-full items-center justify-center rounded-2xl border p-2 transition-colors',
						matched && 'border-green-500 bg-green-500/10 opacity-50',
						wrongPair?.left === item.id && 'border-destructive bg-destructive/10',
						selectedLeft === item.id && !wrongPair && 'border-primary bg-primary/10',
						!matched &&
							!wrongPair &&
							selectedLeft !== item.id &&
							(tileColor ? cn('border-transparent', tileColor) : 'border-border hover:bg-muted')
					)}
				>
					<FieldValue {field} />
				</button>
			{/each}
		</div>
		<div class="space-y-2">
			{#each rightOrder as item (item.id)}
				{@const field = resolveFieldForType(item, config.rightFieldKey)}
				{@const matched = matchedIds.has(item.id)}
				{@const tileColor = tileColorFor(item, field)}
				<button
					type="button"
					onclick={() => pickRight(item.id)}
					disabled={matched}
					class={cn(
						'flex min-h-12 w-full items-center justify-center rounded-2xl border p-2 transition-colors',
						matched && 'border-green-500 bg-green-500/10 opacity-50',
						wrongPair?.right === item.id && 'border-destructive bg-destructive/10',
						selectedRight === item.id && !wrongPair && 'border-primary bg-primary/10',
						!matched &&
							!wrongPair &&
							selectedRight !== item.id &&
							(tileColor ? cn('border-transparent', tileColor) : 'border-border hover:bg-muted')
					)}
				>
					<FieldValue {field} />
				</button>
			{/each}
		</div>
	</div>
</div>
