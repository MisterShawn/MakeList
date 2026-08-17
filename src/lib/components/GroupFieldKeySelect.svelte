<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import type { PollConfig, FieldSelector } from '$lib/db/types';
	import { fieldSelectorLabel } from '$lib/activity-types';

	let {
		config = $bindable<PollConfig>(),
		fieldOptions
	}: {
		config: PollConfig;
		fieldOptions: FieldSelector[];
	} = $props();
</script>

<div class="space-y-1.5">
	<Label>Group name field</Label>
	<Select.Root
		type="single"
		value={config.groupFieldKey ?? 'title'}
		onValueChange={(v) => v && (config.groupFieldKey = v as FieldSelector)}
	>
		<Select.Trigger class="w-full"
			>{fieldSelectorLabel(config.groupFieldKey ?? 'title')}</Select.Trigger
		>
		<Select.Content>
			{#each fieldOptions as opt (opt)}
				<Select.Item value={opt} label={fieldSelectorLabel(opt)} />
			{/each}
		</Select.Content>
	</Select.Root>
</div>
