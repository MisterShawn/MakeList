<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import ResponsiveDialog from '$lib/components/ResponsiveDialog.svelte';
	import IconPicker from '$lib/components/IconPicker.svelte';
	import EmojiPicker from '$lib/components/EmojiPicker.svelte';
	import UserAvatar from '$lib/components/UserAvatar.svelte';
	import * as MakeCard from '$lib/components/make-card/index.js';
	import * as q from '$lib/db/queries';
	import type { User } from '$lib/db/types';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	let users = $state<User[]>([]);
	let dialogOpen = $state(false);
	let editingUser = $state<User | null>(null);
	let nameValue = $state('');
	let avatarKind = $state<'icon' | 'emoji'>('emoji');
	let avatarIconValue = $state<string | undefined>(undefined);
	let avatarEmojiValue = $state<string | undefined>(undefined);
	let saving = $state(false);

	async function refresh() {
		users = await q.listActiveUsers();
	}

	onMount(refresh);

	function openCreateDialog() {
		editingUser = null;
		nameValue = '';
		avatarKind = 'emoji';
		avatarIconValue = undefined;
		avatarEmojiValue = undefined;
		dialogOpen = true;
	}

	function openEditDialog(user: User) {
		editingUser = user;
		nameValue = user.name;
		avatarKind = user.avatarIcon ? 'icon' : 'emoji';
		avatarIconValue = user.avatarIcon;
		avatarEmojiValue = user.avatarEmoji;
		dialogOpen = true;
	}

	async function saveUser() {
		const name = nameValue.trim();
		if (!name) return;
		saving = true;
		try {
			const patch = {
				name,
				avatarIcon: avatarKind === 'icon' ? avatarIconValue : undefined,
				avatarEmoji: avatarKind === 'emoji' ? avatarEmojiValue : undefined
			};
			if (editingUser) {
				await q.updateUser(editingUser.id, patch);
				toast.success('User updated');
			} else {
				await q.createUser(patch);
				toast.success('User created');
			}
			dialogOpen = false;
			await refresh();
		} finally {
			saving = false;
		}
	}

	async function deleteUser(user: User) {
		try {
			await q.softDeleteUser(user.id);
			toast.success(`Moved "${user.name}" to trash`);
			await refresh();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Could not delete user');
		}
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-semibold">Users</h1>
			<p class="text-muted-foreground">Track progress for each learner.</p>
		</div>
		<Button onclick={openCreateDialog} class="gap-1.5">
			<PlusIcon class="size-4" />
			New User
		</Button>
	</div>

	{#if users.length === 0}
		<p class="text-muted-foreground">No users yet. Create one to start tracking progress.</p>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each users as user (user.id)}
				<MakeCard.Root href={resolve('/users/[id]', { id: user.id })}>
					<MakeCard.Menu>
						{#snippet leading()}
							<UserAvatar {user} class="size-6" />
						{/snippet}
						{#snippet menuItems()}
							<DropdownMenu.Item onclick={() => openEditDialog(user)}>
								<PencilIcon class="size-4" />
								Edit
							</DropdownMenu.Item>
							{#if !user.isGuest}
								<DropdownMenu.Item variant="destructive" onclick={() => deleteUser(user)}>
									<Trash2Icon class="size-4" />
									Move to trash
								</DropdownMenu.Item>
							{/if}
						{/snippet}
					</MakeCard.Menu>
					<Card.Header class="pr-8">
						<Card.Title class="flex items-center gap-1.5">
							{user.name}
							{#if user.isGuest}
								<Badge variant="secondary">Guest</Badge>
							{/if}
						</Card.Title>
					</Card.Header>
				</MakeCard.Root>
			{/each}
		</div>
	{/if}
</div>

<ResponsiveDialog
	bind:open={dialogOpen}
	title={editingUser ? 'Edit user' : 'New user'}
	description="Users track their own progress and attempt history."
>
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
