<script lang="ts">
	import ChoiceRunner from './ChoiceRunner.svelte';
	import type { Item, MultipleChoiceConfig, MultipleChoiceDetail } from '$lib/db/types';

	let {
		items,
		config,
		onComplete
	}: {
		items: Item[];
		config: MultipleChoiceConfig;
		onComplete: (result: { score: number; total: number; detail: MultipleChoiceDetail }) => void;
	} = $props();
</script>

<ChoiceRunner
	{items}
	promptFieldKey={config.promptFieldKey}
	answerFieldKey={config.answerFieldKey}
	choiceCount={config.choiceCount ?? 4}
	shuffleQuestions={config.shuffle ?? true}
	onComplete={({ score, total, entries }) =>
		onComplete({ score, total, detail: { type: 'multipleChoice', entries } })}
/>
