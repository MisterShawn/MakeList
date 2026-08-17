<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import ResponsiveDialog from '$lib/components/ResponsiveDialog.svelte';
	import UserAvatar from '$lib/components/UserAvatar.svelte';
	import FlashcardsRunner from '$lib/components/activities/FlashcardsRunner.svelte';
	import MultipleChoiceRunner from '$lib/components/activities/MultipleChoiceRunner.svelte';
	import MatchingRunner from '$lib/components/activities/MatchingRunner.svelte';
	import MemoryRunner from '$lib/components/activities/MemoryRunner.svelte';
	import QuizRunner from '$lib/components/activities/QuizRunner.svelte';
	import PollRunner from '$lib/components/activities/PollRunner.svelte';
	import * as q from '$lib/db/queries';
	import type { Activity, Item, User, AttemptDetail } from '$lib/db/types';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import TrophyIcon from '@lucide/svelte/icons/trophy';

	const activityId = $derived(page.params.id);

	let activity = $state<Activity | null | undefined>(undefined);
	let items = $state<Item[]>([]);
	let groupItems = $state<Item[]>([]);
	let users = $state<User[]>([]);
	let currentUserId = $state<string | undefined>(undefined);

	let phase = $state<'loading' | 'pick-user' | 'playing' | 'results'>('loading');
	let playKey = $state(0);
	let lastResult = $state<{ score: number; total: number } | undefined>(undefined);
	let startedAt = 0;

	async function load() {
		const id = activityId;
		if (!id) return;
		activity = (await q.getActivity(id)) ?? null;
		if (!activity) {
			phase = 'loading';
			return;
		}
		const lists = await q.getListsForActivity(id);

		// For a grouped poll, the group list's items are the roster (who's voting), not
		// vote options — keep them out of the option pool used by every runner.
		const groupList = activity.type === 'poll' ? await q.getGroupListForActivity(id) : undefined;
		groupItems = groupList ? await q.listItemsForList(groupList.id) : [];
		const optionLists = groupList ? lists.filter((l) => l.id !== groupList.id) : lists;

		const itemLists = await Promise.all(optionLists.map((l) => q.listItemsForList(l.id)));
		const seen = new SvelteSet<string>();
		items = itemLists
			.flat()
			.filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)));

		users = await q.listActiveUsers();
		const settings = await q.getSettings();
		if (settings.currentUserId && users.some((u) => u.id === settings.currentUserId)) {
			currentUserId = settings.currentUserId;
		} else {
			// No selection yet: fall back to Guest when there's no other user to choose
			// between, otherwise let the "Who's playing?" picker (which lists Guest too) decide.
			const guest = users.find((u) => u.isGuest);
			const hasOtherUsers = users.some((u) => !u.isGuest);
			currentUserId = !hasOtherUsers && guest ? guest.id : undefined;
		}

		phase = currentUserId ? 'playing' : 'pick-user';
		startedAt = Date.now();
	}

	onMount(load);

	async function chooseUser(userId: string) {
		currentUserId = userId;
		await q.updateSettings({ currentUserId: userId });
		phase = 'playing';
		startedAt = Date.now();
	}

	async function handleComplete(result: { score: number; total: number; detail: AttemptDetail }) {
		if (!activity || !currentUserId) return;
		await q.recordAttempt({
			activityId: activity.id,
			userId: currentUserId,
			type: activity.type,
			score: result.score,
			total: result.total,
			startedAt,
			completedAt: Date.now(),
			detail: result.detail
		});
		lastResult = { score: result.score, total: result.total };
		phase = 'results';
	}

	function playAgain() {
		playKey += 1;
		startedAt = Date.now();
		phase = 'playing';
	}

	const currentUser = $derived(users.find((u) => u.id === currentUserId));
</script>

<div class="space-y-6">
	<Button href="/activities/{activityId}" variant="ghost" size="sm" class="gap-1.5">
		<ArrowLeftIcon class="size-4" />
		Back to activity
	</Button>

	{#if phase === 'loading' || activity === undefined}
		<p class="text-muted-foreground">Loading…</p>
	{:else if activity === null}
		<p class="text-muted-foreground">Activity not found.</p>
	{:else if items.length === 0}
		<p class="text-muted-foreground">
			This activity has no items to play — link a list with items first.
		</p>
	{:else if phase === 'playing'}
		<div class="mb-2 flex items-center justify-center gap-2">
			{#if currentUser}
				<UserAvatar user={currentUser} class="size-6" />
				<span class="text-sm text-muted-foreground">{currentUser.name}</span>
			{/if}
		</div>
		{#key playKey}
			{#if activity.config.type === 'flashcards'}
				<FlashcardsRunner {items} config={activity.config} onComplete={handleComplete} />
			{:else if activity.config.type === 'multipleChoice'}
				<MultipleChoiceRunner {items} config={activity.config} onComplete={handleComplete} />
			{:else if activity.config.type === 'matching'}
				<MatchingRunner {items} config={activity.config} onComplete={handleComplete} />
			{:else if activity.config.type === 'memory'}
				<MemoryRunner {items} config={activity.config} onComplete={handleComplete} />
			{:else if activity.config.type === 'quiz'}
				<QuizRunner {items} config={activity.config} onComplete={handleComplete} />
			{:else if activity.config.type === 'poll'}
				<PollRunner
					{items}
					{groupItems}
					config={activity.config}
					activityName={activity.name}
					onComplete={handleComplete}
				/>
			{/if}
		{/key}
	{:else if phase === 'results' && lastResult}
		<div class="mx-auto max-w-sm space-y-4 text-center">
			<TrophyIcon class="mx-auto size-10 text-muted-foreground" />
			<h2 class="text-2xl font-semibold">
				{lastResult.score} / {lastResult.total}
			</h2>
			<p class="text-muted-foreground">Nice work{currentUser ? `, ${currentUser.name}` : ''}!</p>
			<div class="flex justify-center gap-3">
				<Button variant="outline" href="/activities/{activityId}" class="gap-1.5">
					<ArrowLeftIcon class="size-4" />
					Back
				</Button>
				<Button onclick={playAgain} class="gap-1.5">
					<RotateCcwIcon class="size-4" />
					Play again
				</Button>
			</div>
		</div>
	{/if}
</div>

<ResponsiveDialog open={phase === 'pick-user'} title="Who's playing?">
	{#if users.length === 0}
		<p class="text-muted-foreground">
			No users yet. <a href={resolve('/users')} class="underline">Create one</a> first.
		</p>
	{:else}
		<div class="grid grid-cols-2 gap-2">
			{#each users as user (user.id)}
				<button
					type="button"
					onclick={() => chooseUser(user.id)}
					class="flex flex-col items-center gap-2 rounded-2xl border border-border p-4 hover:bg-muted"
				>
					<UserAvatar {user} class="size-10" />
					<span class="text-sm font-medium">{user.name}</span>
				</button>
			{/each}
		</div>
	{/if}
</ResponsiveDialog>
