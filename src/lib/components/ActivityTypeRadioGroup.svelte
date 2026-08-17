<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import type { ActivityType } from '$lib/db/types';
	import { ACTIVITY_TYPE_OPTIONS } from '$lib/activity-types';
	import type { Component } from 'svelte';
	import LayersIcon from '@lucide/svelte/icons/layers';
	import ListChecksIcon from '@lucide/svelte/icons/list-checks';
	import ArrowLeftRightIcon from '@lucide/svelte/icons/arrow-left-right';
	import BrainIcon from '@lucide/svelte/icons/brain';
	import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
	import VoteIcon from '@lucide/svelte/icons/vote';

	const ICONS: Record<ActivityType, Component> = {
		flashcards: LayersIcon,
		multipleChoice: ListChecksIcon,
		matching: ArrowLeftRightIcon,
		memory: BrainIcon,
		quiz: CircleHelpIcon,
		poll: VoteIcon
	};

	let {
		value,
		onValueChange,
		class: className
	}: {
		value: ActivityType;
		onValueChange: (value: ActivityType) => void;
		class?: string;
	} = $props();
</script>

<RadioGroupPrimitive.Root
	{value}
	onValueChange={(v) => onValueChange(v as ActivityType)}
	class={cn('grid grid-cols-3 gap-2 sm:grid-cols-6', className)}
>
	{#each ACTIVITY_TYPE_OPTIONS as opt (opt.value)}
		{@const Icon = ICONS[opt.value]}
		<RadioGroupPrimitive.Item
			id={`activity-type-${opt.value}`}
			value={opt.value}
			class="group flex flex-col items-center gap-1.5 rounded-2xl border border-border p-3 text-center transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30 data-checked:border-primary data-checked:bg-primary/10"
		>
			<Icon class="size-6 text-muted-foreground group-data-checked:text-primary" />
			<span class="text-xs font-medium">{opt.label}</span>
		</RadioGroupPrimitive.Item>
	{/each}
</RadioGroupPrimitive.Root>
