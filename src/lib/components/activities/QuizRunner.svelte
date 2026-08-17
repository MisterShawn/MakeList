<script lang="ts">
	import ChoiceRunner from './ChoiceRunner.svelte';
	import type { Item, QuizConfig, QuizDetail } from '$lib/db/types';

	let {
		items,
		config,
		onComplete
	}: {
		items: Item[];
		config: QuizConfig;
		onComplete: (result: { score: number; total: number; detail: QuizDetail }) => void;
	} = $props();
</script>

<ChoiceRunner
	{items}
	promptFieldKey={config.promptFieldKey}
	answerFieldKey={config.answerFieldKey}
	questionCount={config.questionCount}
	onComplete={({ score, total, entries, totalTimeMs }) =>
		onComplete({ score, total, detail: { type: 'quiz', entries, totalTimeMs } })}
/>
