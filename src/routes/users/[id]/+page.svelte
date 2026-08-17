<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import ResponsiveDialog from '$lib/components/ResponsiveDialog.svelte';
	import IconPicker from '$lib/components/IconPicker.svelte';
	import EmojiPicker from '$lib/components/EmojiPicker.svelte';
	import UserAvatar from '$lib/components/UserAvatar.svelte';
	import * as q from '$lib/db/queries';
	import type { User, AttemptResult, Activity } from '$lib/db/types';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	const userId = $derived(page.params.id);

	let user = $state<User | null | undefined>(undefined);
	let attempts = $state<(AttemptResult & { activity?: Activity })[]>([]);

	let dialogOpen = $state(false);
	let nameValue = $state('');
	let avatarKind = $state<'icon' | 'emoji'>('emoji');
	let avatarIconValue = $state<string | undefined>(undefined);
	let avatarEmojiValue = $state<string | undefined>(undefined);
	let saving = $state(false);

	async function load() {
		const id = userId;
		if (!id) return;
		user = (await q.getUser(id)) ?? null;
		if (!user) return;
		const rows = await q.listAttemptsForUser(id);
		attempts = await Promise.all(
			rows.map(async (a) => ({ ...a, activity: await q.getActivity(a.activityId) }))
		);
	}

	onMount(load);

	function openEditDialog() {
		if (!user) return;
		nameValue = user.name;
		avatarKind = user.avatarIcon ? 'icon' : 'emoji';
		avatarIconValue = user.avatarIcon;
		avatarEmojiValue = user.avatarEmoji;
		dialogOpen = true;
	}

	async function saveUser() {
		if (!user) return;
		const name = nameValue.trim();
		if (!name) return;
		saving = true;
		try {
			await q.updateUser(user.id, {
				name,
				avatarIcon: avatarKind === 'icon' ? avatarIconValue : undefined,
				avatarEmoji: avatarKind === 'emoji' ? avatarEmojiValue : undefined
			});
			toast.success('User updated');
			dialogOpen = false;
			await load();
		} finally {
			saving = false;
		}
	}

	async function deleteUser() {
		if (!user) return;
		try {
			await q.softDeleteUser(user.id);
			toast.success(`Moved "${user.name}" to trash`);
			await goto(resolve('/users'));
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Could not delete user');
		}
	}
</script>

{#if user === undefined}
	<p class="text-muted-foreground">Loading…</p>
{:else if user === null}
	<p class="text-muted-foreground">User not found.</p>
{:else}
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<UserAvatar {user} class="size-12" />
				<h1 class="text-2xl font-semibold">{user.name}</h1>
				{#if user.isGuest}
					<Badge variant="secondary">Guest</Badge>
				{/if}
			</div>
			<div class="flex gap-2">
				<Button variant="outline" onclick={openEditDialog} class="gap-1.5">
					<PencilIcon class="size-4" />
					Edit
				</Button>
				{#if !user.isGuest}
					<Button variant="destructive" onclick={deleteUser} class="gap-1.5">
						<Trash2Icon class="size-4" />
						Move to trash
					</Button>
				{/if}
			</div>
		</div>

		<div>
			<h2 class="mb-2 text-lg font-medium">Attempt history</h2>
			{#if attempts.length === 0}
				<p class="text-muted-foreground">No activity attempts yet.</p>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Activity</Table.Head>
							<Table.Head>Type</Table.Head>
							<Table.Head>Score</Table.Head>
							<Table.Head>Date</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each attempts as attempt (attempt.id)}
							<Table.Row>
								<Table.Cell>{attempt.activity?.name ?? 'Unknown activity'}</Table.Cell>
								<Table.Cell><Badge variant="secondary">{attempt.type}</Badge></Table.Cell>
								<Table.Cell>{attempt.score} / {attempt.total}</Table.Cell>
								<Table.Cell>
									{new Date(attempt.completedAt ?? attempt.startedAt).toLocaleString()}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</div>
	</div>

	<ResponsiveDialog bind:open={dialogOpen} title="Edit user">
		<div class="space-y-4">
			<div class="space-y-1.5">
				<Label for="user-name">Name</Label>
				<Input id="user-name" bind:value={nameValue} placeholder="e.g. Alex" />
			</div>
			<div class="space-y-1.5">
				<Label>Avatar</Label>
				<Tabs.Root bind:value={avatarKind}>
					<Tabs.List>
						<Tabs.Trigger value="emoji">Emoji</Tabs.Trigger>
						<Tabs.Trigger value="icon">Icon</Tabs.Trigger>
					</Tabs.List>
					<Tabs.Content value="emoji" class="pt-2">
						<EmojiPicker bind:value={avatarEmojiValue} />
					</Tabs.Content>
					<Tabs.Content value="icon" class="pt-2">
						<IconPicker bind:value={avatarIconValue} />
					</Tabs.Content>
				</Tabs.Root>
			</div>
		</div>
		{#snippet footer()}
			<Button variant="outline" onclick={() => (dialogOpen = false)}>Cancel</Button>
			<Button onclick={saveUser} disabled={!nameValue.trim() || saving}>Save</Button>
		{/snippet}
	</ResponsiveDialog>
{/if}
