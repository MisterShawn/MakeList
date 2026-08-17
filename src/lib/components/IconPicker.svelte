<script lang="ts">
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ICON_CATEGORIES, ALL_ICONS } from '$lib/data/icon-data';
	import XIcon from '@lucide/svelte/icons/x';

	let {
		value = $bindable<string | undefined>(undefined),
		placeholder = 'Pick an icon',
		class: className
	}: {
		value?: string;
		placeholder?: string;
		/** No default size — the trigger fills whatever box you give it via this class. */
		class?: string;
	} = $props();

	let open = $state(false);

	const selected = $derived(ALL_ICONS.find((i) => i.name === value));
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon" class={className}>
				{#if selected}
					<selected.icon class="size-3/4" />
				{:else}
					<span class="text-muted-foreground">{placeholder}</span>
				{/if}
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-80 p-0">
		{#if value}
			<div class="border-b p-1">
				<Button
					variant="ghost"
					size="sm"
					class="w-full justify-start gap-2 text-muted-foreground"
					onclick={() => {
						value = undefined;
						open = false;
					}}
				>
					<XIcon class="size-4" />
					Clear
				</Button>
			</div>
		{/if}
		<Command.Root>
			<Command.Input placeholder="Search icons..." />
			<Command.List class="max-h-64">
				<Command.Empty>No icons found.</Command.Empty>
				{#each ICON_CATEGORIES as category (category.label)}
					<Command.Group heading={category.label}>
						<div class="grid grid-cols-6 gap-1 p-1">
							{#each category.icons as entry (entry.name)}
								<Command.Item
									value={entry.name}
									keywords={entry.keywords}
									class="flex items-center justify-center rounded-lg p-1 [&>.cn-command-item-indicator]:hidden"
									onSelect={() => {
										value = entry.name;
										open = false;
									}}
								>
									<entry.icon class="size-4" />
								</Command.Item>
							{/each}
						</div>
					</Command.Group>
				{/each}
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
