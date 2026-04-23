<script lang="ts">
	import type { Item, MediaAsset } from '$lib/db/schema';
	import { Button } from '$lib/components/ui/button';
	import { RotateCcw, Brain } from 'lucide-svelte';
	import { contrastColor } from '$lib/utils';

	interface MemoryCard {
		uid: string;
		itemId: number;
		side: 'term' | 'def';
		text: string;
	}

	interface Props {
		items: Item[];
		mediaMap: Map<number, MediaAsset>;
	}

	let { items }: Props = $props();

	// ── Valid items ───────────────────────────────────────────────────────────

	const validItems = $derived(items.filter((i) => !!i.subtext?.trim()));

	const ROUND_SIZE = 8;

	// ── State ─────────────────────────────────────────────────────────────────

	let cards = $state<MemoryCard[]>([]);
	let selected = $state<string[]>([]);
	let matched = $state(new Set<number>());
	let wrongUids = $state<string[]>([]);
	let checking = $state(false);
	let moves = $state(0);
	let phase = $state<'playing' | 'done'>('playing');

	$effect(() => {
		initRound(validItems);
	});

	// ── Helpers ───────────────────────────────────────────────────────────────

	function shuffleArray<T>(arr: T[]): T[] {
		const a = [...arr];
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}

	function initRound(source: Item[]) {
		const pool = source.slice(0, ROUND_SIZE);
		const newCards: MemoryCard[] = [];
		for (const item of pool) {
			newCards.push({ uid: `${item.id}-t`, itemId: item.id!, side: 'term', text: item.text });
			newCards.push({ uid: `${item.id}-d`, itemId: item.id!, side: 'def', text: item.subtext! });
		}
		cards = shuffleArray(newCards);
		selected = [];
		matched = new Set();
		wrongUids = [];
		checking = false;
		moves = 0;
		phase = 'playing';
	}

	// ── Game logic ────────────────────────────────────────────────────────────

	function clickCard(card: MemoryCard) {
		if (checking || matched.has(card.itemId) || selected.includes(card.uid) || selected.length >= 2) return;

		const newSelected = [...selected, card.uid];
		selected = newSelected;

		if (newSelected.length < 2) return;

		moves++;
		const uid1 = newSelected[0];
		const uid2 = newSelected[1];
		const c1 = cards.find((c) => c.uid === uid1)!;
		const c2 = cards.find((c) => c.uid === uid2)!;

		if (c1.itemId === c2.itemId) {
			const newMatched = new Set([...matched, c1.itemId]);
			matched = newMatched;
			selected = [];
			if (newMatched.size === cards.length / 2) phase = 'done';
		} else {
			checking = true;
			wrongUids = newSelected;
			setTimeout(() => {
				selected = [];
				wrongUids = [];
				checking = false;
			}, 900);
		}
	}

	function restart() {
		initRound(validItems);
	}

	// ── Derived ───────────────────────────────────────────────────────────────

	const pairCount = $derived(cards.length / 2);
	const progress = $derived(pairCount > 0 ? (matched.size / pairCount) * 100 : 0);

	const itemColorMap = $derived(new Map(items.map((i) => [i.id!, i.color ?? ''])));

	function frontClass(card: MemoryCard): string {
		const base = 'memory-face memory-front rounded-xl border flex items-center justify-center p-2 text-center';
		if (matched.has(card.itemId))     return `${base} border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400`;
		if (wrongUids.includes(card.uid)) return `${base} border-red-500 bg-red-500/10 text-red-700 dark:text-red-400`;
		return `${base} border-primary/40 bg-card text-foreground`;
	}

	function frontStyle(card: MemoryCard): string {
		if (matched.has(card.itemId) || wrongUids.includes(card.uid)) return '';
		const color = itemColorMap.get(card.itemId);
		if (!color) return '';
		return `background-color: ${color}; color: ${contrastColor(color)}; border-color: transparent`;
	}
</script>

{#if validItems.length < 2}
	<div class="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
		<Brain size={32} class="text-muted-foreground/40" />
		<p class="text-sm text-muted-foreground">
			Need at least 2 items with a back side (subtext) to play memory.
		</p>
	</div>

{:else if phase === 'done'}
	<div class="flex flex-1 flex-col items-center justify-center gap-6 p-12 text-center">
		<div class="flex flex-col items-center gap-2">
			<p class="text-4xl font-bold">{moves}</p>
			<p class="text-sm text-muted-foreground">
				{moves === pairCount ? 'Perfect memory!' : moves <= Math.ceil(pairCount * 1.5) ? 'Great job!' : 'Keep practicing!'}
			</p>
			<p class="text-xs text-muted-foreground">{pairCount} pairs · {moves} moves</p>
		</div>
		<Button onclick={restart}>
			<RotateCcw size={14} /> Play again
		</Button>
	</div>

{:else}
	<div class="flex flex-1 flex-col overflow-hidden">

		<!-- ── Toolbar ────────────────────────────────────────────────────────── -->
		<div class="flex items-center justify-between border-b border-border px-6 py-2">
			<span class="tabular-nums text-sm text-muted-foreground">
				{matched.size} / {pairCount} pairs
			</span>
			<span class="tabular-nums text-sm text-muted-foreground">
				{moves} moves
			</span>
			<Button variant="ghost" size="sm" onclick={restart} title="Restart">
				<RotateCcw size={14} /> Restart
			</Button>
		</div>

		<!-- ── Progress bar ───────────────────────────────────────────────────── -->
		<div class="h-0.5 bg-muted">
			<div class="h-full bg-primary transition-[width] duration-300" style="width: {progress}%"></div>
		</div>

		<!-- ── Card grid ──────────────────────────────────────────────────────── -->
		<div class="grid grid-cols-3 gap-2 p-6 flex-1 min-h-0 sm:grid-cols-4" style="grid-auto-rows: 1fr">
			{#each cards as card (card.uid)}
				{@const faceUp = selected.includes(card.uid) || matched.has(card.itemId)}
				<div
					style="perspective: 600px"
					role="button"
					tabindex={faceUp ? -1 : 0}
					aria-label={faceUp ? card.text : 'Face-down card'}
					class={faceUp ? 'cursor-default' : 'cursor-pointer'}
					onclick={() => clickCard(card)}
					onkeydown={(e) => e.key === 'Enter' && clickCard(card)}
				>
					<div class="memory-inner h-full {faceUp ? 'face-up' : ''}">
						<!-- Back (face-down) -->
						<div class="memory-face rounded-xl border border-border bg-muted flex items-center justify-center">
							<Brain size={18} class="text-muted-foreground/25" />
						</div>
						<!-- Front (face-up) -->
						<div class={frontClass(card)} style={frontStyle(card)}>
							<span class="line-clamp-4 text-xs font-medium leading-snug">{card.text}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>

	</div>
{/if}

<style>
	.memory-inner {
		transform-style: preserve-3d;
		transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
	}
	.memory-inner.face-up {
		transform: rotateY(180deg);
	}
	.memory-face {
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
		position: absolute;
		inset: 0;
	}
	.memory-front {
		transform: rotateY(180deg);
	}
</style>
