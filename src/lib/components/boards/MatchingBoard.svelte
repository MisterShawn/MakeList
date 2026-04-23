<script lang="ts">
	import type { Item, MediaAsset } from '$lib/db/schema';
	import { Button } from '$lib/components/ui/button';
	import { Shuffle, RotateCcw } from 'lucide-svelte';
	import { contrastColor } from '$lib/utils';

	interface Props {
		items: Item[];
		mediaMap: Map<number, MediaAsset>;
		hideMatched?: boolean;
	}

	let { items, hideMatched = false }: Props = $props();

	// ── Valid items ───────────────────────────────────────────────────────────

	const validItems = $derived(items.filter((i) => !!i.subtext?.trim()));

	const ROUND_SIZE = 8;

	// ── State ─────────────────────────────────────────────────────────────────

	let shuffled = $state(false);
	let round = $state<Item[]>([]);
	let terms = $state<Item[]>([]);
	let defs = $state<Item[]>([]);
	let selectedTermId = $state<number | null>(null);
	let selectedDefId = $state<number | null>(null);
	let matched = $state(new Set<number>());
	let wrongTermId = $state<number | null>(null);
	let wrongDefId = $state<number | null>(null);
	let errors = $state(0);
	let phase = $state<'playing' | 'done'>('playing');
	let checking = $state(false);

	$effect(() => {
		initRound(validItems, false);
		shuffled = false;
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

	function initRound(source: Item[], doShuffle: boolean) {
		const pool = doShuffle ? shuffleArray(source) : [...source];
		const newRound = pool.slice(0, ROUND_SIZE);
		round = newRound;
		terms = shuffleArray([...newRound]);
		defs = shuffleArray([...newRound]);
		matched = new Set();
		selectedTermId = null;
		selectedDefId = null;
		wrongTermId = null;
		wrongDefId = null;
		errors = 0;
		checking = false;
		phase = 'playing';
	}

	// ── Selection & matching ──────────────────────────────────────────────────

	function selectTerm(id: number) {
		if (matched.has(id) || checking) return;
		selectedTermId = selectedTermId === id ? null : id;
		tryMatch();
	}

	function selectDef(id: number) {
		if (matched.has(id) || checking) return;
		selectedDefId = selectedDefId === id ? null : id;
		tryMatch();
	}

	function tryMatch() {
		if (selectedTermId === null || selectedDefId === null) return;
		checking = true;
		if (selectedTermId === selectedDefId) {
			matched = new Set([...matched, selectedTermId]);
			selectedTermId = null;
			selectedDefId = null;
			checking = false;
			if (matched.size === round.length) phase = 'done';
		} else {
			errors++;
			wrongTermId = selectedTermId;
			wrongDefId = selectedDefId;
			setTimeout(() => {
				wrongTermId = null;
				wrongDefId = null;
				selectedTermId = null;
				selectedDefId = null;
				checking = false;
			}, 600);
		}
	}

	// ── Toolbar actions ───────────────────────────────────────────────────────

	function toggleShuffle() {
		shuffled = !shuffled;
		initRound(validItems, shuffled);
	}

	function restart() {
		initRound(validItems, shuffled);
	}

	// ── Derived ───────────────────────────────────────────────────────────────

	const progress = $derived(round.length > 0 ? (matched.size / round.length) * 100 : 0);
	const shownTerms = $derived(hideMatched ? terms.filter((t) => !matched.has(t.id!)) : terms);
	const shownDefs = $derived(hideMatched ? defs.filter((d) => !matched.has(d.id!)) : defs);

	// ── Tile class & style ────────────────────────────────────────────────────

	function tileClass(isMatched: boolean, isSelected: boolean, isWrong: boolean): string {
		const base =
			'rounded-xl border px-4 py-3 text-sm font-medium text-left transition-colors min-h-[2.75rem] w-full whitespace-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
		if (isMatched) return `${base} border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400 cursor-default`;
		if (isWrong)   return `${base} border-red-500 bg-red-500/10 text-red-700 dark:text-red-400 cursor-pointer`;
		if (isSelected) return `${base} border-primary bg-primary/10 text-primary cursor-pointer`;
		return `${base} border-border bg-card hover:bg-accent cursor-pointer`;
	}

	function termStyle(term: Item, isMatched: boolean, isWrong: boolean, isSelected: boolean): string {
		if (!term.color || isMatched || isWrong || isSelected) return '';
		return `background-color: ${term.color}; color: ${contrastColor(term.color)}; border-color: transparent`;
	}
</script>

{#if validItems.length < 2}
	<div class="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
		<Shuffle size={32} class="text-muted-foreground/40" />
		<p class="text-sm text-muted-foreground">
			Need at least 2 items with a back side (subtext) to play matching.
		</p>
	</div>

{:else if phase === 'done'}
	<div class="flex flex-1 flex-col items-center justify-center gap-6 p-12 text-center">
		<div class="flex flex-col items-center gap-2">
			<p class="text-4xl font-bold">{errors === 0 ? 'Perfect!' : `${errors}`}</p>
			<p class="text-sm text-muted-foreground">
				{#if errors === 0}
					No mistakes — well done!
				{:else if errors === 1}
					1 mistake
				{:else}
					{errors} mistakes
				{/if}
			</p>
		</div>
		<div class="flex gap-3">
			<Button variant="outline" onclick={restart}>
				<RotateCcw size={14} /> Play again
			</Button>
			<Button onclick={() => { shuffled = !shuffled; initRound(validItems, !shuffled); }}>
				<Shuffle size={14} /> Shuffle & retry
			</Button>
		</div>
	</div>

{:else}
	<div class="flex flex-1 flex-col overflow-hidden">

		<!-- ── Toolbar ────────────────────────────────────────────────────────── -->
		<div class="flex items-center justify-between border-b border-border px-6 py-2">
			<span class="tabular-nums text-sm text-muted-foreground">
				{matched.size} / {round.length}
			</span>
			<div class="flex gap-1">
				<Button variant={shuffled ? 'secondary' : 'ghost'} size="sm" onclick={toggleShuffle} title="Shuffle">
					<Shuffle size={14} /> Shuffle
				</Button>
				<Button variant="ghost" size="sm" onclick={restart} title="Restart">
					<RotateCcw size={14} /> Restart
				</Button>
			</div>
		</div>

		<!-- ── Progress bar ───────────────────────────────────────────────────── -->
		<div class="h-0.5 bg-muted">
			<div class="h-full bg-primary transition-[width] duration-300" style="width: {progress}%"></div>
		</div>

		<!-- ── Two columns ────────────────────────────────────────────────────── -->
		<div class="flex flex-1 gap-3 overflow-y-auto p-6">

			<!-- Terms (left) -->
			<div class="flex flex-1 flex-col gap-2">
				{#each shownTerms as term (term.id)}
					{@const isMatched = matched.has(term.id!)}
					<button
						type="button"
						class={tileClass(isMatched, selectedTermId === term.id!, wrongTermId === term.id!)}
						style={termStyle(term, isMatched, wrongTermId === term.id!, selectedTermId === term.id!)}
						onclick={() => selectTerm(term.id!)}
						disabled={isMatched}
					>
						{term.text}
					</button>
				{/each}
			</div>

			<!-- Definitions (right) -->
			<div class="flex flex-1 flex-col gap-2">
				{#each shownDefs as def (def.id)}
					{@const isMatched = matched.has(def.id!)}
					<button
						type="button"
						class={tileClass(isMatched, selectedDefId === def.id!, wrongDefId === def.id!)}
						onclick={() => selectDef(def.id!)}
						disabled={isMatched}
					>
						{def.subtext}
					</button>
				{/each}
			</div>

		</div>
	</div>
{/if}
