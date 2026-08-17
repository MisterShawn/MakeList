<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { TagsInput } from '$lib/components/ui/tags-input/index.js';
	import TagBadges from '$lib/components/TagBadges.svelte';
	import ActivityConfigFields from '$lib/components/ActivityConfigFields.svelte';
	import GroupFieldKeySelect from '$lib/components/GroupFieldKeySelect.svelte';
	import ActivityTypeRadioGroup from '$lib/components/ActivityTypeRadioGroup.svelte';
	import * as q from '$lib/db/queries';
	import type {
		Activity,
		ActivityConfig,
		ActivityType,
		List,
		AttemptResult,
		User,
		FieldSelector,
		TagColor
	} from '$lib/db/types';
	import { activityTypeLabel, defaultConfigForType } from '$lib/activity-types';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import PlayIcon from '@lucide/svelte/icons/play';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

	const activityId = $derived(page.params.id);

	let activity = $state<Activity | null | undefined>(undefined);
	let linkedLists = $state<List[]>([]);
	let allLists = $state<List[]>([]);
	let attempts = $state<(AttemptResult & { user?: User })[]>([]);

	let nameValue = $state('');
	let typeValue = $state<ActivityType>('flashcards');
	let selectedListIds = $state<string[]>([]);
	let groupListId = $state<string | undefined>(undefined);
	let config = $state(defaultConfigForType('flashcards'));
	let fieldOptions = $state<FieldSelector[]>(['title']);
	let tagsValue = $state<string[]>([]);
	let tagSuggestions = $state<string[]>([]);
	let tagColors = $state<Record<string, TagColor>>({});
	let saving = $state(false);

	function tagColor(tag: string) {
		const c = tagColors[tag];
		return c ? { bg: c.bgColor, text: c.textColor } : undefined;
	}

	// Remembers each type's config (and poll's group list) for the life of the loaded form,
	// so accidentally clicking a different Type doesn't discard what was already filled in.
	let configByType = $state<Partial<Record<ActivityType, ActivityConfig>>>({});
	let cachedGroupListId = $state<string | undefined>(undefined);

	async function load() {
		const id = activityId;
		if (!id) return;
		activity = (await q.getActivity(id)) ?? null;
		if (!activity) return;
		linkedLists = await q.getListsForActivity(id);
		allLists = await q.listActiveLists();
		const rows = await q.listAttemptsForActivity(id);
		attempts = await Promise.all(
			rows.map(async (a) => ({ ...a, user: await q.getUser(a.userId) }))
		);

		// Populate the inline edit form from the freshly-loaded activity.
		nameValue = activity.name;
		typeValue = activity.type;
		config = activity.config;
		tagsValue = activity.tags ?? [];
		selectedListIds = linkedLists.map((l) => l.id);
		groupListId = (await q.getGroupListForActivity(id))?.id;
		await refreshFieldOptions();
		configByType = {};
		cachedGroupListId = undefined;
		tagSuggestions = await q.listAllTags();
		tagColors = await q.getAllTagColors();
	}

	onMount(load);

	async function refreshFieldOptions() {
		const types = await q.getDistinctFieldTypes(selectedListIds);
		fieldOptions = ['title', ...types];
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
		if (!activity) return;
		const name = nameValue.trim();
		if (!name) return;
		saving = true;
		try {
			await q.updateActivity(activity.id, { name, type: typeValue, config, tags: tagsValue });
			const currentIds = new Set(linkedLists.map((l) => l.id));
			const nextIds = new Set(selectedListIds);
			for (const id of nextIds) {
				// Upserts either way, and syncs role — covers both new links and an
				// existing link's group assignment changing.
				await q.linkListToActivity(activity.id, id, id === groupListId ? 'group' : undefined);
			}
			for (const id of currentIds) {
				if (!nextIds.has(id)) await q.unlinkListFromActivity(activity.id, id);
			}
			toast.success('Activity updated');
			await load();
		} finally {
			saving = false;
		}
	}

	async function deleteActivity() {
		if (!activity) return;
		await q.softDeleteActivity(activity.id);
		toast.success(`Moved "${activity.name}" to trash`);
		await goto(resolve('/activities'));
	}
</script>

{#if activity === undefined}
	<p class="text-muted-foreground">Loading…</p>
{:else if activity === null}
	<p class="text-muted-foreground">Activity not found.</p>
{:else}
	<div class="space-y-6">
		<div>
			<Button href="/activities" variant="ghost" size="sm" class="mb-2 gap-1.5">
				<ArrowLeftIcon class="size-4" />
				Activities
			</Button>
			<div class="flex items-start justify-between">
				<div>
					<div class="flex items-center gap-2">
						<h1 class="text-2xl font-semibold">{nameValue || activity.name}</h1>
						<Badge variant="secondary">{activityTypeLabel(typeValue)}</Badge>
					</div>
					<div class="mt-1.5">
						<TagBadges tags={activity.tags ?? []} />
					</div>
				</div>
				<div class="flex gap-2">
					<Button
						href={resolve('/activities/[id]/play', { id: activity.id })}
						size="sm"
						class="gap-1.5"
					>
						<PlayIcon class="size-4" />
						Play
					</Button>
					<Button variant="destructive" size="sm" onclick={deleteActivity} class="gap-1.5">
						<Trash2Icon class="size-4" />
						Trash
					</Button>
				</div>
			</div>
		</div>

		<Tabs.Root value="overview">
			<Tabs.List>
				<Tabs.Trigger value="overview">Overview</Tabs.Trigger>
				<Tabs.Trigger value="history">History</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="overview" class="space-y-4 pt-4">
				<div class="space-y-4">
					<div class="space-y-1.5">
						<Label for="activity-name">Name</Label>
						<Input id="activity-name" bind:value={nameValue} />
					</div>
					<div class="space-y-1.5">
						<Label>Type</Label>
						<ActivityTypeRadioGroup value={typeValue} onValueChange={onTypeChange} />
					</div>
					<div class="space-y-1.5">
						<Label for="activity-tags">Tags</Label>
						<TagsInput
							id="activity-tags"
							bind:value={tagsValue}
							suggestions={tagSuggestions}
							placeholder="Add tag…"
							getTagColor={tagColor}
						/>
					</div>
					<div class="space-y-1.5">
						<Label>Lists</Label>
						{#if allLists.length === 0}
							<p class="text-sm text-muted-foreground">No lists yet — create one first.</p>
						{:else}
							<div
								class="max-h-40 space-y-1.5 overflow-y-auto rounded-2xl border border-border p-2"
							>
								{#each allLists as list (list.id)}
									<label
										class="flex items-center gap-2 rounded-lg px-1.5 py-1 text-sm hover:bg-muted"
									>
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
								Optionally mark one linked list as the "Group" — e.g. student names. Players pick
								their name first, then vote using the other list(s).
							</p>
						</div>
						{#if groupListId && config.type === 'poll'}
							<GroupFieldKeySelect bind:config {fieldOptions} />
						{/if}
					{/if}
					<Button onclick={saveActivity} disabled={!nameValue.trim() || saving}>
						Save changes
					</Button>
				</div>
			</Tabs.Content>
			<Tabs.Content value="history" class="pt-4">
				{#if attempts.length === 0}
					<p class="text-muted-foreground">No attempts yet.</p>
				{:else}
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>User</Table.Head>
								<Table.Head>Score</Table.Head>
								<Table.Head>Date</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each attempts as attempt (attempt.id)}
								<Table.Row>
									<Table.Cell>{attempt.user?.name ?? 'Unknown user'}</Table.Cell>
									<Table.Cell>{attempt.score} / {attempt.total}</Table.Cell>
									<Table.Cell>
										{new Date(attempt.completedAt ?? attempt.startedAt).toLocaleString()}
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				{/if}
			</Tabs.Content>
		</Tabs.Root>
	</div>
{/if}
