<script lang="ts">
	import type { Item, MediaAsset } from '$lib/db/schema';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { ChevronRight, Shuffle, RotateCcw, Play, Pause, HelpCircle, Check, X } from 'lucide-svelte';
	import { contrastColor } from '$lib/utils';

	interface Props {
		items: Item[];
		mediaMap: Map<number, MediaAsset>;
		autoAdvance?: boolean;
		autoAdvanceDelay?: number;
	}

	let { items, mediaMap, autoAdvance = false, autoAdvanceDelay = 1500 }: Props = $props();

	// ── Valid items ───────────────────────────────────────────────────────────

	const validItems = $derived(items.filter((i) => !!i.subtext?.trim()));

	// ── State ─────────────────────────────────────────────────────────────────

	let shuffled = $state(false);
	let deck = $state<Item[]>([]);
	let currentIndex = $state(0);
	let inputValue = $state('');
	let answered = $state(false);
	let correct = $state(false);
	let score = $state(0);
	let phase = $state<'playing' | 'done'>('playing');

	$effect(() => {
		const newDeck = [...validItems];
		deck = newDeck;
		currentIndex = 0;
		inputValue = '';
		answered = false;
		correct = false;
		score = 0;
		phase = 'playing';
		shuffled = false;
		clearAutoAdvance();
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

	function buildDeck(doShuffle: boolean): Item[] {
		return doShuffle ? shuffleArray([...validItems]) : [...validItems];
	}

	// ── Auto-advance ──────────────────────────────────────────────────────────

	let autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null;
	let countdown = $state(false);

	function clearAutoAdvance() {
		if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
		countdown = false;
	}

	// ── Game actions ──────────────────────────────────────────────────────────

	function submit() {
		if (answered || !inputValue.trim()) return;
		const item = deck[currentIndex];
		const isCorrect = inputValue.trim().toLowerCase() === item.subtext!.trim().toLowerCase();
		correct = isCorrect;
		answered = true;
		if (isCorrect) {
			score++;
			if (autoAdvance) {
				countdown = true;
				autoAdvanceTimer = setTimeout(() => {
					autoAdvanceTimer = null;
					countdown = false;
					next();
				}, autoAdvanceDelay);
			}
		}
	}

	function next() {
		clearAutoAdvance();
		stopAudio();
		if (currentIndex < deck.length - 1) {
			currentIndex++;
			inputValue = '';
			answered = false;
			correct = false;
		} else {
			phase = 'done';
		}
	}

	function toggleShuffle() {
		shuffled = !shuffled;
		deck = buildDeck(shuffled);
		currentIndex = 0;
		inputValue = '';
		answered = false;
		correct = false;
		score = 0;
		phase = 'playing';
		stopAudio();
		clearAutoAdvance();
	}

	function restart() {
		deck = buildDeck(shuffled);
		currentIndex = 0;
		inputValue = '';
		answered = false;
		correct = false;
		score = 0;
		phase = 'playing';
		stopAudio();
		clearAutoAdvance();
	}

	// ── Derived ───────────────────────────────────────────────────────────────

	const currentItem = $derived(deck[currentIndex]);
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
		if (audioPlaying) { audioEl.pause(); audioPlaying = false; }
		else { audioEl.play(); audioPlaying = true; }
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

	// ── Focus management ──────────────────────────────────────────────────────

	function focusInput(node: HTMLElement) {
		requestAnimationFrame(() => {
			(node.querySelector('input') ?? node).focus();
		});
	}

	// ── Keyboard ──────────────────────────────────────────────────────────────

	function handleKeydown(e: KeyboardEvent) {
		if (e.key !== 'Enter') return;
		if (e.target instanceof HTMLInputElement) {
			e.preventDefault();
			if (!answered) submit();
			else next();
		} else if (answered) {
			next();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if validItems.length === 0}
	<div class="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
		<HelpCircle size={32} class="text-muted-foreground/40" />
		<p class="text-sm text-muted-foreground">
			No items to quiz on. Items need a back side (subtext) to appear in a quiz.
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
			<Button onclick={() => { shuffled = !shuffled; deck = buildDeck(!shuffled); currentIndex = 0; inputValue = ''; answered = false; correct = false; score = 0; phase = 'playing'; }}>
				<Shuffle size={14} /> Shuffle & retry
			</Button>
		</div>
	</div>

{:else if currentItem}
	{@const media = getMedia(currentItem)}
	<div class="flex flex-1 flex-col overflow-hidden">

		<!-- ── Toolbar ────────────────────────────────────────────────────────── -->
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

		<!-- ── Body ───────────────────────────────────────────────────────────── -->
		<div class="flex flex-1 flex-col items-center gap-6 overflow-y-auto p-6">

			<!-- Question -->
			<div
				class="flex w-full max-w-sm flex-col items-center gap-4 text-center rounded-2xl transition-colors {currentItem.color ? 'px-6 py-4' : ''}"
				style={currentItem.color ? `background-color: ${currentItem.color}; color: ${contrastColor(currentItem.color)}` : ''}
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
				<p class="text-xl font-semibold leading-snug">{currentItem.text}</p>
			</div>

			<!-- Input + actions -->
			<div class="flex w-full max-w-sm flex-col gap-3">
				{#key currentIndex}
					<div use:focusInput>
						<Input
							type="text"
							placeholder="Type your answer…"
							bind:value={inputValue}
							disabled={answered}
							class="text-center {answered ? (correct ? 'border-green-500 bg-green-500/5' : 'border-red-500 bg-red-500/5') : ''}"
						/>
					</div>
				{/key}

				{#if !answered}
					<Button onclick={submit} disabled={!inputValue.trim()} class="w-full">
						Submit
					</Button>
				{:else}
					<!-- Feedback -->
					{#if correct}
						<p class="flex items-center justify-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
							<Check size={15} /> Correct!
						</p>
					{:else}
						<p class="flex items-center justify-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-400">
							<X size={15} /> Answer: <span class="font-semibold">{currentItem.subtext}</span>
						</p>
					{/if}

					<!-- Next -->
					{#key answered}
						<Button
							onclick={next}
							class="w-full"
							style={countdown ? `background:linear-gradient(to right,var(--primary) 50%,var(--muted) 50%);background-size:200% 100%;animation:cdBtn ${autoAdvanceDelay}ms linear forwards;box-shadow:0 0 0 3px color-mix(in oklch,var(--primary) 35%,transparent)` : ''}
						>
							<span style={countdown ? 'mix-blend-mode:difference;color:white;display:inline-flex;align-items:center;gap:0.375rem' : ''}>
								{currentIndex < deck.length - 1 ? 'Next' : 'See results'}
								<ChevronRight size={15} />
							</span>
						</Button>
					{/key}
				{/if}
			</div>

		</div>
	</div>
{/if}
