<script lang="ts">
	import type { Item, MediaAsset } from '$lib/db/schema';
	import { Button } from '$lib/components/ui/button';
	import { ChevronLeft, ChevronRight, Shuffle, RotateCcw, Play, Pause, Layers } from 'lucide-svelte';
	import { contrastColor } from '$lib/utils';

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
	let deck = $state<Item[]>([]);
	let currentIndex = $state(0);
	let flipped = $state(false);

	$effect(() => {
		deck = [...validItems];
		currentIndex = 0;
		flipped = false;
	});

	function shuffleArray(arr: Item[]): Item[] {
		const a = [...arr];
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}

	function toggleShuffle() {
		shuffled = !shuffled;
		deck = shuffled ? shuffleArray(validItems) : [...validItems];
		currentIndex = 0;
		flipped = false;
		stopAudio();
		clearAutoAdvance();
	}

	function restart() {
		deck = shuffled ? shuffleArray(validItems) : [...validItems];
		currentIndex = 0;
		flipped = false;
		stopAudio();
		clearAutoAdvance();
	}

	function prev() {
		if (currentIndex > 0) {
			currentIndex--;
			flipped = false;
			stopAudio();
			clearAutoAdvance();
		}
	}

	function next() {
		clearAutoAdvance();
		if (currentIndex < deck.length - 1) {
			currentIndex++;
			flipped = false;
			stopAudio();
		}
	}

	function flip() {
		flipped = !flipped;
		if (flipped && autoAdvance) {
			countdown = true;
			autoAdvanceTimer = setTimeout(() => {
				autoAdvanceTimer = null;
				countdown = false;
				next();
			}, autoAdvanceDelay);
		} else {
			clearAutoAdvance();
		}
	}

	const currentItem = $derived(deck[currentIndex]);
	const progress = $derived(deck.length > 0 ? ((currentIndex + 1) / deck.length) * 100 : 0);

	// ── Audio ─────────────────────────────────────────────────────────────────

	// ── Auto-advance ──────────────────────────────────────────────────────────

	let autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null;
	let countdown = $state(false);

	function clearAutoAdvance() {
		if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
		countdown = false;
	}

	// ── Audio ─────────────────────────────────────────────────────────────────

	let audioPlaying = $state(false);
	let audioEl: HTMLAudioElement | null = null;

	function stopAudio() {
		if (audioEl) {
			audioEl.pause();
			audioEl.currentTime = 0;
		}
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

	// ── Keyboard ──────────────────────────────────────────────────────────────

	function handleKeydown(e: KeyboardEvent) {
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
		if (e.key === 'ArrowLeft') prev();
		else if (e.key === 'ArrowRight') next();
		else if (e.key === ' ') { e.preventDefault(); flip(); }
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if validItems.length === 0}
	<div class="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
		<Layers size={32} class="text-muted-foreground/40" />
		<p class="text-sm text-muted-foreground">
			No cards to show. Items need a back side (subtext) to appear in a flashcard board.
		</p>
	</div>
{:else}
	<div class="flex flex-1 flex-col overflow-hidden">

		<!-- ── Toolbar ────────────────────────────────────────────────────────── -->
		<div class="flex items-center justify-between border-b border-border px-6 py-2">
			<span class="tabular-nums text-sm text-muted-foreground">
				{currentIndex + 1} / {deck.length}
			</span>
			<div class="flex gap-1">
				<Button
					variant={shuffled ? 'secondary' : 'ghost'}
					size="sm"
					onclick={toggleShuffle}
					title="Shuffle"
				>
					<Shuffle size={14} />
					Shuffle
				</Button>
				<Button variant="ghost" size="sm" onclick={restart} title="Restart">
					<RotateCcw size={14} />
					Restart
				</Button>
			</div>
		</div>

		<!-- ── Progress bar ───────────────────────────────────────────────────── -->
		<div class="h-0.5 bg-muted">
			<div
				class="h-full bg-primary transition-[width] duration-300"
				style="width: {progress}%"
			></div>
		</div>

		<!-- ── Card ───────────────────────────────────────────────────────────── -->
		<div class="flex flex-1 items-center justify-center p-6">
			{#if currentItem}
				{@const media = getMedia(currentItem)}
				<div class="w-full max-w-sm" style="perspective: 1200px">
					<div
						class="card-inner relative w-full cursor-pointer rounded-2xl"
						class:flipped
						onclick={flip}
						onkeydown={(e) => e.key === 'Enter' && flip()}
						role="button"
						tabindex="0"
						aria-label="Flip card"
						style="padding-bottom: 133.333%"
					>
						<!-- Front -->
						<div
							class="card-face absolute inset-0 flex flex-col items-center justify-between rounded-2xl border p-6 shadow-md {currentItem.color ? 'border-transparent' : 'border-border bg-card'}"
							style={currentItem.color ? `background-color: ${currentItem.color}; color: ${contrastColor(currentItem.color)}` : ''}
						>
							<!-- Media -->
							<div class="flex flex-1 items-center justify-center">
								{#if media?.type === 'emoji'}
									<img
										src="/openmoji/{media.hex.toUpperCase()}.svg"
										alt=""
										class="h-20 w-20"
										draggable="false"
									/>
								{:else if media?.type === 'image'}
									<img
										src={media.asset.dataUrl}
										alt=""
										class="max-h-36 w-full object-contain"
										draggable="false"
									/>
								{:else if media?.type === 'audio'}
									<Button
										variant="outline"
										size="icon"
										class="h-16 w-16 rounded-full"
										onclick={(e) => toggleAudio(e, media.asset.dataUrl)}
									>
										{#if audioPlaying}
											<Pause size={22} />
										{:else}
											<Play size={22} />
										{/if}
									</Button>
								{/if}
							</div>

							<!-- Text -->
							<p class="text-center text-xl font-semibold leading-snug">{currentItem.text}</p>

							<!-- Hint -->
							<p class="text-xs opacity-50">tap to reveal</p>
						</div>

						<!-- Back -->
						<div class="card-face card-back absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 shadow-md">
							<p class="text-center text-xl font-medium text-muted-foreground">
								{currentItem.subtext}
							</p>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- ── Navigation ─────────────────────────────────────────────────────── -->
		<div class="flex items-center justify-between border-t border-border px-6 py-3">
			<Button variant="outline" size="icon" onclick={prev} disabled={currentIndex === 0}>
				<ChevronLeft size={18} />
			</Button>
			{#key flipped}
				<Button
					variant="outline"
					size="icon"
					onclick={next}
					disabled={currentIndex === deck.length - 1}
					style={countdown ? `background:linear-gradient(to right,var(--primary) 50%,var(--muted) 50%);background-size:200% 100%;animation:cdBtn ${autoAdvanceDelay}ms linear forwards;border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in oklch,var(--primary) 35%,transparent)` : ''}
				>
					<span style={countdown ? 'mix-blend-mode:difference;color:white;display:inline-flex' : ''}>
						<ChevronRight size={18} />
					</span>
				</Button>
			{/key}
		</div>

	</div>
{/if}

<style>
	.card-inner {
		transform-style: preserve-3d;
		transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}
	.card-inner.flipped {
		transform: rotateY(180deg);
	}
	.card-face {
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
	}
	.card-back {
		transform: rotateY(180deg);
	}

</style>
