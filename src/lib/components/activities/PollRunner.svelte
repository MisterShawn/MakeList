<script lang="ts">
	import { untrack } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import FieldValue from '$lib/components/FieldValue.svelte';
	import { resolveFieldForType, isTitleField } from '$lib/activity-runtime';
	import { cn } from '$lib/utils.js';
	import type { Item, ItemField, PollConfig, PollDetail } from '$lib/db/types';

	/** Only colorizes the idle (not-yet-voted/not-checked) state — feedback wins otherwise. */
	function idleColorFor(item: Item, field: ItemField): string | undefined {
		return isTitleField(item, field) && (item.bgColor || item.textColor)
			? cn(item.bgColor, item.textColor)
			: undefined;
	}
	import CheckIcon from '@lucide/svelte/icons/check';

	let {
		items,
		groupItems = [],
		config,
		activityName,
		onComplete
	}: {
		items: Item[];
		/** Roster of voters (e.g. student names). When present, voting runs one member at
		 * a time: pick a name, vote, return to the roster — instead of a single one-shot vote. */
		groupItems?: Item[];
		config: PollConfig;
		activityName: string;
		onComplete: (result: { score: number; total: number; detail: PollDetail }) => void;
	} = $props();

	const isGrouped = untrack(() => groupItems.length > 0);

	let phase = $state<'roster' | 'voting'>(isGrouped ? 'roster' : 'voting');
	let currentVoterId = $state<string | undefined>(undefined);
	let selectedIds = $state<string[]>([]);
	const voterChoices = new SvelteMap<string, string[]>();

	function toggle(id: string, checked: boolean) {
		if (config.allowMultiple) {
			selectedIds = checked ? [...selectedIds, id] : selectedIds.filter((i) => i !== id);
		} else {
			selectedIds = checked ? [id] : [];
		}
	}

	function buildEntries(): PollDetail['entries'] {
		const counts = new SvelteMap<string, number>();
		if (isGrouped) {
			for (const choices of voterChoices.values()) {
				for (const id of choices) counts.set(id, (counts.get(id) ?? 0) + 1);
			}
		} else {
			for (const id of selectedIds) counts.set(id, 1);
		}
		return items.map((item) => ({ itemId: item.id, votes: counts.get(item.id) ?? 0 }));
	}

	/** Single-voter mode (no group configured): one vote submits and ends the activity. */
	function submit() {
		onComplete({
			score: selectedIds.length,
			total: config.allowMultiple ? items.length : 1,
			detail: { type: 'poll', entries: buildEntries() }
		});
	}

	function pickVoter(voterId: string) {
		currentVoterId = voterId;
		selectedIds = voterChoices.get(voterId) ?? [];
		phase = 'voting';
	}

	function cancelVote() {
		currentVoterId = undefined;
		selectedIds = [];
		phase = 'roster';
	}

	function submitVote() {
		if (!currentVoterId) return;
		voterChoices.set(currentVoterId, selectedIds);
		currentVoterId = undefined;
		selectedIds = [];
		phase = 'roster';
	}

	function finishPoll() {
		const voterEntries: NonNullable<PollDetail['voterEntries']> = [...voterChoices.entries()].map(
			([voterItemId, choiceItemIds]) => ({ voterItemId, choiceItemIds })
		);
		onComplete({
			score: voterChoices.size,
			total: groupItems.length,
			detail: { type: 'poll', entries: buildEntries(), voterEntries }
		});
	}

	const currentVoter = $derived(groupItems.find((g) => g.id === currentVoterId));
</script>

{#if phase === 'roster'}
	<div class="mx-auto max-w-md space-y-4">
		<div class="text-center">
			<h2 class="text-lg font-medium">{activityName}</h2>
			<p class="text-sm text-muted-foreground">Pick your name to vote</p>
		</div>
		<Progress value={(voterChoices.size / groupItems.length) * 100} />
		<p class="text-center text-sm text-muted-foreground">
			{voterChoices.size} / {groupItems.length} voted
		</p>
		<div class="grid grid-cols-2 gap-2">
			{#each groupItems as member (member.id)}
				{@const field = resolveFieldForType(member, config.groupFieldKey ?? 'title')}
				{@const voted = voterChoices.has(member.id)}
				{@const idleColor = idleColorFor(member, field)}
				<button
					type="button"
					onclick={() => pickVoter(member.id)}
					class={cn(
						'flex items-center justify-center gap-2 rounded-2xl border p-3 transition-colors',
						voted
							? 'border-green-500 bg-green-500/10'
							: (idleColor ?? 'border-border hover:bg-muted')
					)}
				>
					{#if voted}
						<CheckIcon class="size-4 shrink-0 text-green-600" />
					{/if}
					<FieldValue {field} />
				</button>
			{/each}
		</div>
		<Button
			onclick={finishPoll}
			disabled={voterChoices.size === 0}
			variant="outline"
			class="w-full"
		>
			Finish poll
		</Button>
	</div>
{:else}
	<div class="mx-auto max-w-md space-y-4">
		<h2 class="text-center text-lg font-medium">
			{#if currentVoter}
				{@const voterField = resolveFieldForType(currentVoter, config.groupFieldKey ?? 'title')}
				<FieldValue field={voterField} />, cast your vote
			{:else}
				{activityName}
			{/if}
		</h2>
		<div class="space-y-2">
			{#each items as item (item.id)}
				{@const field = resolveFieldForType(item, config.promptFieldKey)}
				{@const checked = selectedIds.includes(item.id)}
				{@const idleColor = idleColorFor(item, field)}
				<label
					class={cn(
						'flex items-center gap-3 rounded-2xl border p-3 transition-colors',
						checked ? 'border-primary bg-primary/10' : (idleColor ?? 'border-border hover:bg-muted')
					)}
				>
					<Checkbox {checked} onCheckedChange={(v) => toggle(item.id, v === true)} />
					<FieldValue {field} />
				</label>
			{/each}
		</div>
		{#if isGrouped}
			<div class="flex gap-2">
				<Button variant="outline" onclick={cancelVote} class="flex-1">Cancel</Button>
				<Button onclick={submitVote} disabled={selectedIds.length === 0} class="flex-1">
					Submit
				</Button>
			</div>
		{:else}
			<Button onclick={submit} disabled={selectedIds.length === 0} class="w-full">Submit</Button>
		{/if}
	</div>
{/if}
