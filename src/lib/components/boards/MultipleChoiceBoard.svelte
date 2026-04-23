<script lang="ts">
	import type { Item, MediaAsset } from '$lib/db/schema';
	import { Button } from '$lib/components/ui/button';
	import {
		ChevronRight,
		Shuffle,
		RotateCcw,
		Play,
		Pause,
		CheckSquare,
		Check,
		X,
	} from 'lucide-svelte';
	import { contrastColor } from '$lib/utils';

	interface Option {
		text: string;
		correct: boolean;
	}

	interface QuestionCard {
		item: Item;
		options: Option[];
	}

	interface Props {
		items: Item[];
		mediaMap: Map<number, MediaAsset>;
		autoAdvance?: boolean;
		autoAdvanceDelay?: number;
	}

	let { items, mediaMap, autoAdvance = false, autoAdvanceDelay = 1500 }: Props = $props();

	// ── Deck ──────────────────────────────────────────────────────────────────

	const validItems = $derived(items.filter((i) => !!i.subtext?.trim()));

	let shuffled = $state(false);
	let deck = $state<QuestionCard[]>([]);
	let currentIndex = $state(0);
	let selectedIdx = $state<number | null>(null);
	let score = $state(0);
	let phase = $state<'playing' | 'done'>('playing');

	$effect(() => {
		deck = buildDeck(validItems, false);
		currentIndex = 0;
		selectedIdx = null;
		score = 0;
		phase = 'playing';
	});

	function shuffleArray<T>(arr: T[]): T[] {
		const a = [...arr];
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}

	function buildOptions(item: Item, allItems: Item[]): Option[] {
		const correct: Option = { text: item.subtext!, correct: true };
		const wrongs = shuffleArray(allItems.filter((i) => i.id !== item.id))
			.slice(0, 3)
			.map((i): Option => ({ text: i.subtext!, correct: false }));
		return shuffleArray([correct, ...wrongs]);
	}

	function buildDeck(source: Item[], doShuffle: boolean): QuestionCard[] {
		const ordered = doShuffle ? shuffleArray(source) : [...source];
		return ordered.map((item) => ({ item, options: buildOptions(item, source) }));
	}

	// ── Auto-advance ──────────────────────────────────────────────────────────

	let autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null;
	let countdown = $state(false);

	function clearAutoAdvance() {
		if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
		countdown = false;
	}

	function toggleShuffle() {
		shuffled = !shuffled;
		deck = buildDeck(validItems, shuffled);
		currentIndex = 0;
		selectedIdx = null;
		score = 0;
		phase = 'playing';
		stopAudio();
		clearAutoAdvance();
	}

	function restart() {
		deck = buildDeck(validItems, shuffled);
		currentIndex = 0;
		selectedIdx = null;
		score = 0;
		phase = 'playing';
		stopAudio();
		clearAutoAdvance();
	}

	function selectOption(idx: number) {
		if (selectedIdx !== null) return;
		selectedIdx = idx;
		if (deck[currentIndex].options[idx].correct) score++;
		if (autoAdvance) {
			countdown = true;
			autoAdvanceTimer = setTimeout(() => {
				autoAdvanceTimer = null;
				countdown = false;
				next();
			}, autoAdvanceDelay);
		}
	}

	function next() {
		clearAutoAdvance();
		if (currentIndex < deck.length - 1) {
			currentIndex++;
			selectedIdx = null;
			stopAudio();
		} else {
			phase = 'done';
			stopAudio();
		}
	}

	const currentCard = $derived(deck[currentIndex]);
	const answered = $derived(selectedIdx !== null);
	const progress = $derived(deck.length > 0 ? ((currentIndex + 1) / deck.length) * 100 : 0);

	// ── Audio ─────────────────────────────────────────────────────────────────

	let audioPlaying = $state(false);
	let audioEl: HTMLAudioElement | null = null;

	function stopAudio() {
		if (audioEl) { audioEl.pause(); audioEl.currentTime = 0; }
		audioPlaying = false;
	}

	function toggleAudio(e: MouseEvent, dataUrl: string) {
		e.stopPropagation();
		if (!audioEl || audioEl.src !== dataUrl) {
			audioEl = new Audio(dataUrl);
			audioEl.onended = () => (audioPlaying = false);
		}
		if (audioPlaying) {
			audioEl.pause();
			audioPlaying = false;
		} else {
			audioEl.play();
			audioPlaying = true;
		}
	}

	// ── Media ─────────────────────────────────────────────────────────────────

	type MediaInfo =
		| { type: 'emoji'; hex: string }
		| { type: 'image'; asset: MediaAsset }
		| { type: 'audio'; asset: MediaAsset };

	function getMedia(item: Item): MediaInfo | null {
		if (item.emojiId) return { type: 'emoji', hex: item.emojiId };
		const imgId = item.mediaId ?? item.gifId;
		if (imgId != null) {
			const asset = mediaMap.get(imgId);
			if (asset) return { type: 'image', asset };
		}
		if (item.audioId != null) {
			const asset = mediaMap.get(item.audioId);
			if (asset) return { type: 'audio', asset };
		}
		return null;
	}

	// ── Option button style ───────────────────────────────────────────────────

	function optionClass(idx: number, option: Option): string {
		const base = 'h-auto min-h-[3rem] w-full whitespace-normal rounded-xl border px-4 py-3 text-sm font-medium text-left transition-colors';
		if (!answered) return `${base} border-border bg-card hover:bg-accent`;
		if (option.correct) return `${base} border-green-500 bg-green-500/10 text-green-700 dark:text-green-400`;
		if (idx === selectedIdx) return `${base} border-red-500 bg-red-500/10 text-red-700 dark:text-red-400`;
		return `${base} border-border bg-card opacity-40`;
	}

	// ── Keyboard ──────────────────────────────────────────────────────────────

	function handleKeydown(e: KeyboardEvent) {
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
		if (e.key === 'Enter' && answered) next();
		if (!answered && currentCard) {
			if (e.key === '1') selectOption(0);
			else if (e.key === '2') selectOption(1);
			else if (e.key === '3') selectOption(2);
			else if (e.key === '4') selectOption(3);
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if validItems.length < 2}
	<div class="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
		<CheckSquare size={32} class="text-muted-foreground/40" />
		<p class="text-sm text-muted-foreground">
			Need at least 2 items with a back side (subtext) to play multiple choice.
		</p>
	</div>

{:else if phase === 'done'}
	<div class="flex flex-1 flex-col items-center justify-center gap-6 p-12 text-center">
		<div class="flex flex-col items-center gap-2">
			<p class="text-4xl font-bold">{score} / {deck.length}</p>
			<p class="text-sm text-muted-foreground">
				{score === deck.length ? 'Perfect score!' : score >= deck.length * 0.7 ? 'Great work!' : 'Keep practicing!'}
			</p>
		</div>
		<div class="flex gap-3">
			<Button variant="outline" onclick={restart}>
				<RotateCcw size={14} /> Play again
			</Button>
			<Button onclick={() => { shuffled = !shuffled; restart(); }}>
				<Shuffle size={14} /> Shuffle & retry
			</Button>
		</div>
	</div>

{:else if currentCard}
	{@const media = getMedia(currentCard.item)}
	<div class="flex flex-1 flex-col overflow-hidden">

		<!-- ── Toolbar ──────────────────────────────────────────────────────── -->
		<div class="flex items-center justify-between border-b border-border px-6 py-2">
			<span class="tabular-nums text-sm text-muted-foreground">
				{currentIndex + 1} / {deck.length}
			</span>
			<span class="flex items-center gap-1.5 text-sm">
				<Check size={14} class="text-green-500" />
				<span class="font-medium">{score}</span>
				<span class="text-muted-foreground">correct</span>
			</span>
			<div class="flex gap-1">
				<Button variant={shuffled ? 'secondary' : 'ghost'} size="sm" onclick={toggleShuffle} title="Shuffle">
					<Shuffle size={14} />
					Shuffle
				</Button>
				<Button variant="ghost" size="sm" onclick={restart} title="Restart">
					<RotateCcw size={14} />
					Restart
				</Button>
			</div>
		</div>

		<!-- ── Progress bar ─────────────────────────────────────────────────── -->
		<div class="h-0.5 bg-muted">
			<div class="h-full bg-primary transition-[width] duration-300" style="width: {progress}%"></div>
		</div>

		<!-- ── Scrollable body ──────────────────────────────────────────────── -->
		<div class="flex flex-1 flex-col gap-6 overflow-y-auto p-6">

			<!-- Question -->
			<div
				class="flex flex-col items-center gap-4 text-center rounded-2xl transition-colors {currentCard.item.color ? 'px-6 py-4' : ''}"
				style={currentCard.item.color ? `background-color: ${currentCard.item.color}; color: ${contrastColor(currentCard.item.color)}` : ''}
			>
				{#if media?.type === 'emoji'}
					<img src="/openmoji/{media.hex.toUpperCase()}.svg" alt="" class="h-16 w-16" draggable="false" />
				{:else if media?.type === 'image'}
					<img src={media.asset.dataUrl} alt="" class="max-h-40 w-full object-contain" draggable="false" />
				{:else if media?.type === 'audio'}
					<Button
						variant="outline"
						size="icon"
						class="h-14 w-14 rounded-full"
						onclick={(e) => toggleAudio(e, media.asset.dataUrl)}
					>
						{#if audioPlaying}<Pause size={20} />{:else}<Play size={20} />{/if}
					</Button>
				{/if}
				<p class="text-xl font-semibold leading-snug">{currentCard.item.text}</p>
			</div>

			<!-- Options -->
			<div class="grid grid-cols-2 gap-3">
				{#each currentCard.options as option, idx}
					<button
						type="button"
						class={optionClass(idx, option)}
						onclick={() => selectOption(idx)}
						disabled={answered}
					>
						<span class="mb-1 block text-xs font-semibold opacity-50">{idx + 1}</span>
						{option.text}
					</button>
				{/each}
			</div>

			<!-- Feedback + Next -->
			{#if answered}
				<div class="flex flex-col items-center gap-4">
					{#if currentCard.options[selectedIdx!].correct}
						<p class="flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
							<Check size={15} /> Correct!
						</p>
					{:else}
						<p class="flex items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-400">
							<X size={15} /> The correct answer was: <span class="font-semibold">{currentCard.options.find(o => o.correct)?.text}</span>
						</p>
					{/if}
					{#key answered}
						<Button
							onclick={next}
							class="w-full max-w-xs"
							style={countdown ? `background:linear-gradient(to right,var(--primary) 50%,var(--muted) 50%);background-size:200% 100%;animation:cdBtn ${autoAdvanceDelay}ms linear forwards;box-shadow:0 0 0 3px color-mix(in oklch,var(--primary) 35%,transparent)` : ''}
						>
							<span style={countdown ? 'mix-blend-mode:difference;color:white;display:inline-flex;align-items:center;gap:0.375rem' : ''}>
								{currentIndex < deck.length - 1 ? 'Next' : 'See results'}
								<ChevronRight size={15} />
							</span>
						</Button>
					{/key}
				</div>
			{/if}

		</div>
	</div>
{/if}

