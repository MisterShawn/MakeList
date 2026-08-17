<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import ResponsiveDialog from '$lib/components/ResponsiveDialog.svelte';
	import ActivityConfigFields from '$lib/components/ActivityConfigFields.svelte';
	import GroupFieldKeySelect from '$lib/components/GroupFieldKeySelect.svelte';
	import ActivityTypeRadioGroup from '$lib/components/ActivityTypeRadioGroup.svelte';
	import * as MakeCard from '$lib/components/make-card/index.js';
	import TagBadges from '$lib/components/TagBadges.svelte';
	import * as q from '$lib/db/queries';
	import type { Activity, ActivityConfig, ActivityType, List, FieldSelector } from '$lib/db/types';
	import { activityTypeLabel, defaultConfigForType } from '$lib/activity-types';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import PlayIcon from '@lucide/svelte/icons/play';
	import GamepadIcon from '@lucide/svelte/icons/gamepad-2';

	let activities = $state<Activity[]>([]);
	let allLists = $state<List[]>([]);
	let linkedListsByActivity = $state<Record<string, List[]>>({});

	let dialogOpen = $state(false);
	let nameValue = $state('');
	let typeValue = $state<ActivityType>('flashcards');
	let selectedListIds = $state<string[]>([]);
	let groupListId = $state<string | undefined>(undefined);
	let config = $state(defaultConfigForType('flashcards'));
	let fieldOptions = $state<FieldSelector[]>(['title']);
	let saving = $state(false);

	// Remembers each type's config (and poll's group list) for the life of the open dialog,
	// so accidentally clicking a different Type doesn't discard what was already filled in.
	let configByType = $state<Partial<Record<ActivityType, ActivityConfig>>>({});
	let cachedGroupListId = $state<string | undefined>(undefined);

	async function refresh() {
		activities = await q.listActiveActivities();
		allLists = await q.listActiveLists();
		const linked: Record<string, List[]> = {};
		await Promise.all(
			activities.map(async (a) => {
				linked[a.id] = await q.getListsForActivity(a.id);
			})
		);
		linkedListsByActivity = linked;
	}

	onMount(refresh);

	async function refreshFieldOptions() {
		const types = await q.getDistinctFieldTypes(selectedListIds);
		fieldOptions = ['title', ...types];
	}

	function openCreateDialog() {
		nameValue = '';
		typeValue = 'flashcards';
		selectedListIds = [];
		groupListId = undefined;
		config = defaultConfigForType('flashcards');
		fieldOptions = ['title'];
		configByType = {};
		cachedGroupListId = undefined;
		dialogOpen = true;
	}

	function onTypeChange(newType: ActivityType) {
		configByType[typeValue] = config;
		if (typeValue === 'poll') cachedGroupListId = groupListId;
		typeValue = newType;
		config = configByType[newType] ?? defaultConfigForType(newType);
		groupListId = newType === 'poll' ? cachedGroupListId : undefined;
	}

	function toggleList(listId: string, checked: boolean) {
		selectedListIds = checked
			? [...selectedListIds, listId]
			: selectedListIds.filter((id) => id !== listId);
		if (!checked && groupListId === listId) groupListId = undefined;
		if (!checked && cachedGroupListId === listId) cachedGroupListId = undefined;
		refreshFieldOptions();
	}

	async function saveActivity() {
		const name = nameValue.trim();
		if (!name) return;
		saving = true;
		try {
			const activity = await q.createActivity({ name, type: typeValue, config });
			toast.success('Activity created');
			for (const id of selectedListIds) {
				await q.linkListToActivity(activity.id, id, id === groupListId ? 'group' : undefined);
			}
			dialogOpen = false;
			await refresh();
		} finally {
			saving = false;
		}
	}

	async function deleteActivity(activity: Activity) {
		await q.softDeleteActivity(activity.id);
		toast.success(`Moved "${activity.name}" to trash`);
		await refresh();
	}

	// The card itself links to the activity's detail page, so Play needs to stop that
	// navigation and go to the play page instead, rather than being a nested <a>.
	function playActivity(e: MouseEvent, activity: Activity) {
		e.preventDefault();
		goto(resolve('/activities/[id]/play', { id: activity.id }));
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-semibold">Activities</h1>
			<p class="text-muted-foreground">Flash cards, quizzes, matching, and more.</p>
		</div>
		<Button onclick={openCreateDialog} class="gap-1.5">
			<PlusIcon class="size-4" />
			New Activity
		</Button>
	</div>

	{#if activities.length === 0}
		<p class="text-muted-foreground">No activities yet. Create one to start learning.</p>
	{:else}
		<div class="grid gap-4">
			{#each activities as activity (activity.id)}
				<MakeCard.Root href={resolve('/activities/[id]', { id: activity.id })}>
					<MakeCard.Menu icon={GamepadIcon}>
						{#snippet menuItems()}
							<DropdownMenu.Item variant="destructive" onclick={() => deleteActivity(activity)}>
								<Trash2Icon class="size-4" />
								Trash
							</DropdownMenu.Item>
						{/snippet}
					</MakeCard.Menu>
					<Card.Header class="pr-8">
						<Card.Title>{activity.name}</Card.Title>
						<Badge variant="secondary" class="mt-1">{activityTypeLabel(activity.type)}</Badge>
					</Card.Header>
					<Card.Content class="flex-1 space-y-2">
						{#if linkedListsByActivity[activity.id]?.length}
							<div class="flex flex-wrap gap-1.5">
								{#each linkedListsByActivity[activity.id] as list (list.id)}
									<Badge variant="outline">{list.name}</Badge>
								{/each}
							</div>
						{:else}
							<p class="text-sm text-muted-foreground">No lists linked yet.</p>
						{/if}
						<TagBadges tags={activity.tags ?? []} />
					</Card.Content>
					<Card.Footer>
						<Button
							size="lg"
							class="flex-1 cursor-pointer hover:bg-warning"
							onclick={(e) => playActivity(e, activity)}
						>
							<PlayIcon class="size-4" />
							Play
						</Button>
					</Card.Footer>
				</MakeCard.Root>
			{/each}
		</div>
	{/if}
</div>

<ResponsiveDialog bind:open={dialogOpen} title="New activity">
	<div class="space-y-4">
		<div class="space-y-1.5">
			<Label for="activity-name">Name</Label>
			<Input id="activity-name" bind:value={nameValue} placeholder="e.g. Animal Flash Cards" />
		</div>
		<div class="space-y-1.5">
			<Label>Type</Label>
			<ActivityTypeRadioGroup value={typeValue} onValueChange={onTypeChange} />
		</div>
		<div class="space-y-1.5">
			<Label>Lists</Label>
			{#if allLists.length === 0}
				<p class="text-sm text-muted-foreground">No lists yet — create one first.</p>
			{:else}
				<div class="max-h-40 space-y-1.5 overflow-y-auto rounded-2xl border border-border p-2">
					{#each allLists as list (list.id)}
						<label class="flex items-center gap-2 rounded-lg px-1.5 py-1 text-sm hover:bg-muted">
							<Checkbox
								checked={selectedListIds.includes(list.id)}
								onCheckedChange={(v) => toggleList(list.id, v === true)}
							/>
							{list.name}
						</label>
					{/each}
				</div>
			{/if}
		</div>
		{#if selectedListIds.length > 0}
			<ActivityConfigFields bind:config {fieldOptions} />
		{/if}
		{#if typeValue === 'poll' && selectedListIds.length > 0}
			<div class="space-y-1.5">
				<Label>Group</Label>
				<Select.Root
					type="single"
					value={groupListId ?? 'none'}
					onValueChange={(v) => (groupListId = v === 'none' ? undefined : v)}
				>
					<Select.Trigger class="w-full">
						{groupListId
							? (allLists.find((l) => l.id === groupListId)?.name ?? 'Choose a list')
							: 'None'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="none" label="None" />
						{#each allLists.filter((l) => selectedListIds.includes(l.id)) as list (list.id)}
							<Select.Item value={list.id} label={list.name} />
						{/each}
					</Select.Content>
				</Select.Root>
				<p class="text-xs text-muted-foreground">
					Optionally mark one linked list as the "Group" — e.g. student names. Players pick their
					name first, then vote using the other list(s).
				</p>
			</div>
			{#if groupListId && config.type === 'poll'}
				<GroupFieldKeySelect bind:config {fieldOptions} />
			{/if}
		{/if}
	</div>
	{#snippet footer()}
		<Button variant="outline" onclick={() => (dialogOpen = false)}>Cancel</Button>
		<Button onclick={saveActivity} disabled={!nameValue.trim() || saving}>Save</Button>
	{/snippet}
</ResponsiveDialog>
