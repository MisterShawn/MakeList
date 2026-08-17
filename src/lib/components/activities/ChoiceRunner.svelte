<script lang="ts">
	import { untrack } from 'svelte';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import FieldValue from '$lib/components/FieldValue.svelte';
	import { resolveFieldForType, isTitleField, shuffle } from '$lib/activity-runtime';
	import { cn } from '$lib/utils.js';
	import type { Item, FieldSelector } from '$lib/db/types';

	export interface ChoiceEntry {
		itemId: string;
		selectedItemId?: string;
		correct: boolean;
		timeMs: number;
	}

	let {
		items,
		promptFieldKey,
		answerFieldKey,
		choiceCount = 4,
		questionCount,
		shuffleQuestions = true,
		onComplete
	}: {
		items: Item[];
		promptFieldKey: FieldSelector;
		answerFieldKey: FieldSelector;
		choiceCount?: number;
		questionCount?: number;
		shuffleQuestions?: boolean;
		onComplete: (result: {
			score: number;
			total: number;
			entries: ChoiceEntry[];
			totalTimeMs: number;
		}) => void;
	} = $props();

	const questions = $state(
		untrack(() =>
			(shuffleQuestions ? shuffle(items) : items).slice(0, questionCount ?? items.length)
		)
	);

	let index = $state(0);
	let selectedId = $state<string | undefined>(undefined);
	let questionStartedAt = $state(Date.now());
	let runStartedAt = Date.now();
	const entries: ChoiceEntry[] = [];

	const currentItem = $derived(questions[index]);
	const promptField = $derived(resolveFieldForType(currentItem, promptFieldKey));
	// Only the prompt is colored — answer choices already use color to signal
	// correct/incorrect, and an item's own color would conflict with that feedback.
	const promptColor = $derived(
		isTitleField(currentItem, promptField) && (currentItem.bgColor || currentItem.textColor)
			? cn(currentItem.bgColor, currentItem.textColor)
			: undefined
	);

	const choices = $derived.by(() => {
		const distractorPool = items.filter((i) => i.id !== currentItem.id);
		const distractors = shuffle(distractorPool).slice(0, Math.max(0, choiceCount - 1));
		return shuffle([currentItem, ...distractors]);
	});

	function choose(choiceItem: Item) {
		if (selectedId) return;
		selectedId = choiceItem.id;
		const correct = choiceItem.id === currentItem.id;
		entries.push({
			itemId: currentItem.id,
			selectedItemId: choiceItem.id,
			correct,
			timeMs: Date.now() - questionStartedAt
		});
		setTimeout(next, 700);
	}

	function next() {
		if (index + 1 >= questions.length) {
			const score = entries.filter((e) => e.correct).length;
			onComplete({
				score,
				total: questions.length,
				entries,
				totalTimeMs: Date.now() - runStartedAt
			});
			return;
		}
		index += 1;
		selectedId = undefined;
		questionStartedAt = Date.now();
	}
</script>

<div class="mx-auto max-w-md space-y-4">
	<Progress value={(index / questions.length) * 100} />
	<p class="text-center text-sm text-muted-foreground">{index + 1} / {questions.length}</p>

	<div
		class={cn(
			'rounded-3xl border border-border p-6 text-center text-lg font-medium shadow-sm',
			promptColor ?? 'bg-card'
		)}
	>
		<FieldValue field={promptField} />
	</div>

	<div class="grid grid-cols-2 gap-3">
		{#each choices as choice (choice.id)}
			{@const field = resolveFieldForType(choice, answerFieldKey)}
			{@const isSelected = selectedId === choice.id}
			{@const isCorrectChoice = choice.id === currentItem.id}
			<button
				type="button"
				onclick={() => choose(choice)}
				disabled={!!selectedId}
				class="flex min-h-16 items-center justify-center rounded-2xl border p-3 text-center transition-colors
					{selectedId && isCorrectChoice ? 'border-green-500 bg-green-500/10' : ''}
					{selectedId && isSelected && !isCorrectChoice ? 'border-destructive bg-destructive/10' : ''}
					{!selectedId ? 'border-border hover:bg-muted' : 'border-border'}"
			>
				<FieldValue field={{ ...field, id: `${choice.id}-choice` }} />
			</button>
		{/each}
	</div>
</div>
