<script lang="ts">
	import { untrack } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import FieldValue from '$lib/components/FieldValue.svelte';
	import { resolveFieldForType, isTitleField, shuffle } from '$lib/activity-runtime';
	import { cn } from '$lib/utils.js';
	import type { Item, FlashcardsConfig, FlashcardsDetail } from '$lib/db/types';
	import CheckIcon from '@lucide/svelte/icons/check';
	import XIcon from '@lucide/svelte/icons/x';

	let {
		items,
		config,
		onComplete
	}: {
		items: Item[];
		config: FlashcardsConfig;
		onComplete: (result: { score: number; total: number; detail: FlashcardsDetail }) => void;
	} = $props();

	const deck = $state(untrack(() => (config.shuffle ? shuffle(items) : items)));

	let index = $state(0);
	let showBack = $state(false);
	let cardStartedAt = $state(Date.now());
	const entries: FlashcardsDetail['entries'] = [];

	const currentItem = $derived(deck[index]);
	const frontField = $derived(resolveFieldForType(currentItem, config.frontFieldKey));
	const backField = $derived(resolveFieldForType(currentItem, config.backFieldKey));
	const currentField = $derived(showBack ? backField : frontField);
	// Only the item's own title is colored (never an icon/image/etc. picked as the field),
	// and only once the item actually has a color assigned.
	const cardColor = $derived(
		isTitleField(currentItem, currentField) && (currentItem.bgColor || currentItem.textColor)
			? cn(currentItem.bgColor, currentItem.textColor)
			: undefined
	);

	function flip() {
		showBack = true;
	}

	function answer(knewIt: boolean) {
		entries.push({ itemId: currentItem.id, knewIt, timeMs: Date.now() - cardStartedAt });
		if (index + 1 >= deck.length) {
			const score = entries.filter((e) => e.knewIt).length;
			onComplete({ score, total: deck.length, detail: { type: 'flashcards', entries } });
			return;
		}
		index += 1;
		showBack = false;
		cardStartedAt = Date.now();
	}
</script>

<div class="mx-auto max-w-md space-y-4">
	<Progress value={(index / deck.length) * 100} />
	<p class="text-center text-sm text-muted-foreground">{index + 1} / {deck.length}</p>

	<button
		type="button"
		onclick={flip}
		class={cn(
			'flex min-h-48 w-full items-center justify-center rounded-3xl border border-border p-8 text-center text-xl font-medium shadow-sm',
			cardColor ?? 'bg-card'
		)}
	>
		<FieldValue field={currentField} />
	</button>

	{#if !showBack}
		<Button onclick={flip} type="button" class="w-full">Show answer</Button>
	{:else}
		<div class="grid grid-cols-2 gap-3">
			<Button variant="outline" onclick={() => answer(false)} type="button" class="gap-1.5">
				<XIcon class="size-4" />
				Didn't know it
			</Button>
			<Button onclick={() => answer(true)} type="button" class="gap-1.5">
				<CheckIcon class="size-4" />
				Knew it
			</Button>
		</div>
	{/if}
</div>
