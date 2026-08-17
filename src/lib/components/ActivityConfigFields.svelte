<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import type { ActivityConfig, FieldSelector } from '$lib/db/types';
	import { fieldSelectorLabel } from '$lib/activity-types';

	let {
		config = $bindable<ActivityConfig>(),
		fieldOptions
	}: {
		config: ActivityConfig;
		fieldOptions: FieldSelector[];
	} = $props();
</script>

{#snippet fieldSelect(label: string, value: FieldSelector, onChange: (v: FieldSelector) => void)}
	<div class="space-y-1.5">
		<Label>{label}</Label>
		<Select.Root type="single" {value} onValueChange={(v) => v && onChange(v as FieldSelector)}>
			<Select.Trigger class="w-full">{fieldSelectorLabel(value)}</Select.Trigger>
			<Select.Content>
				{#each fieldOptions as opt (opt)}
					<Select.Item value={opt} label={fieldSelectorLabel(opt)} />
				{/each}
			</Select.Content>
		</Select.Root>
	</div>
{/snippet}

<div class="space-y-3">
	{#if config.type === 'flashcards'}
		{@render fieldSelect('Front field', config.frontFieldKey, (v) => (config.frontFieldKey = v))}
		{@render fieldSelect('Back field', config.backFieldKey, (v) => (config.backFieldKey = v))}
	{:else if config.type === 'multipleChoice'}
		{@render fieldSelect('Prompt field', config.promptFieldKey, (v) => (config.promptFieldKey = v))}
		{@render fieldSelect('Answer field', config.answerFieldKey, (v) => (config.answerFieldKey = v))}
	{:else if config.type === 'matching'}
		{@render fieldSelect('Left field', config.leftFieldKey, (v) => (config.leftFieldKey = v))}
		{@render fieldSelect('Right field', config.rightFieldKey, (v) => (config.rightFieldKey = v))}
	{:else if config.type === 'memory'}
		{@render fieldSelect('Match field', config.fieldKeyA, (v) => (config.fieldKeyA = v))}
	{:else if config.type === 'quiz'}
		{@render fieldSelect('Prompt field', config.promptFieldKey, (v) => (config.promptFieldKey = v))}
		{@render fieldSelect('Answer field', config.answerFieldKey, (v) => (config.answerFieldKey = v))}
	{:else if config.type === 'poll'}
		{@render fieldSelect('Prompt field', config.promptFieldKey, (v) => (config.promptFieldKey = v))}
	{/if}
</div>
