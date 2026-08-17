<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import * as q from '$lib/db/queries';
	import { emptyTrash } from '$lib/db/trash';
	import type { User, List, Item, Activity, MediaAsset } from '$lib/db/types';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	let retentionDays = $state(30);
	let users = $state<User[]>([]);
	let lists = $state<List[]>([]);
	let items = $state<(Item & { listName?: string })[]>([]);
	let activities = $state<Activity[]>([]);
	let media = $state<MediaAsset[]>([]);

	async function refresh() {
		const settings = await q.getSettings();
		retentionDays = settings.trashRetentionDays;
		users = await q.listTrashedUsers();
		lists = await q.listTrashedLists();
		activities = await q.listTrashedActivities();
		media = await q.listTrashedAssets();
		const rawItems = await q.listAllTrashedItems();
		items = await Promise.all(
			rawItems.map(async (item) => ({ ...item, listName: (await q.getList(item.listId))?.name }))
		);
	}

	onMount(refresh);

	function daysUntilPurge(deletedAt: number): number {
		const ageDays = (Date.now() - deletedAt) / 86_400_000;
		return Math.max(0, Math.ceil(retentionDays - ageDays));
	}

	async function restoreUser(id: string) {
		await q.restoreUser(id);
		toast.success('User restored');
		await refresh();
	}
	async function purgeUser(id: string) {
		await q.purgeUser(id);
		toast.success('User permanently deleted');
		await refresh();
	}
	async function restoreList(id: string) {
		await q.restoreList(id);
		toast.success('List restored');
		await refresh();
	}
	async function purgeList(id: string) {
		await q.purgeList(id);
		toast.success('List permanently deleted');
		await refresh();
	}
	async function restoreItem(id: string) {
		await q.restoreItem(id);
		toast.success('Item restored');
		await refresh();
	}
	async function purgeItem(id: string) {
		await q.purgeItem(id);
		toast.success('Item permanently deleted');
		await refresh();
	}
	async function restoreActivity(id: string) {
		await q.restoreActivity(id);
		toast.success('Activity restored');
		await refresh();
	}
	async function purgeActivity(id: string) {
		await q.purgeActivity(id);
		toast.success('Activity permanently deleted');
		await refresh();
	}
	async function restoreAsset(id: string) {
		await q.restoreAsset(id);
		toast.success('Media restored');
		await refresh();
	}
	async function purgeAsset(id: string) {
		await q.purgeAsset(id);
		toast.success('Media permanently deleted');
		await refresh();
	}

	async function handleEmptyTrash() {
		await emptyTrash();
		toast.success('Trash emptied');
		await refresh();
	}

	const totalCount = $derived(
		users.length + lists.length + items.length + activities.length + media.length
	);
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-semibold">Trash</h1>
			<p class="text-muted-foreground">
				Items are permanently deleted after {retentionDays} days, or empty the trash manually.
			</p>
		</div>
		{#if totalCount > 0}
			<AlertDialog.Root>
				<AlertDialog.Trigger>
					{#snippet child({ props })}
						<Button {...props} variant="destructive" class="gap-1.5">
							<Trash2Icon class="size-4" />
							Empty Trash
						</Button>
					{/snippet}
				</AlertDialog.Trigger>
				<AlertDialog.Content>
					<AlertDialog.Header>
						<AlertDialog.Title>Empty trash?</AlertDialog.Title>
						<AlertDialog.Description>
							This permanently deletes all {totalCount} trashed items. This cannot be undone.
						</AlertDialog.Description>
					</AlertDialog.Header>
					<AlertDialog.Footer>
						<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
						<AlertDialog.Action onclick={handleEmptyTrash}>Empty Trash</AlertDialog.Action>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>
		{/if}
	</div>

	<Tabs.Root value="lists">
		<Tabs.List>
			<Tabs.Trigger value="lists">Lists ({lists.length})</Tabs.Trigger>
			<Tabs.Trigger value="items">Items ({items.length})</Tabs.Trigger>
			<Tabs.Trigger value="activities">Activities ({activities.length})</Tabs.Trigger>
			<Tabs.Trigger value="users">Users ({users.length})</Tabs.Trigger>
			<Tabs.Trigger value="media">Media ({media.length})</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="lists" class="pt-4">
			{#if lists.length === 0}
				<p class="text-muted-foreground">No trashed lists.</p>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Name</Table.Head>
							<Table.Head>Purges in</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each lists as list (list.id)}
							<Table.Row>
								<Table.Cell>{list.name}</Table.Cell>
								<Table.Cell>{daysUntilPurge(list.deletedAt)} days</Table.Cell>
								<Table.Cell class="flex justify-end gap-2">
									<Button
										variant="outline"
										size="sm"
										onclick={() => restoreList(list.id)}
										class="gap-1.5"
									>
										<RotateCcwIcon class="size-4" />
										Restore
									</Button>
									<AlertDialog.Root>
										<AlertDialog.Trigger>
											{#snippet child({ props })}
												<Button {...props} variant="destructive" size="sm">Delete</Button>
											{/snippet}
										</AlertDialog.Trigger>
										<AlertDialog.Content>
											<AlertDialog.Header>
												<AlertDialog.Title>Permanently delete "{list.name}"?</AlertDialog.Title>
												<AlertDialog.Description
													>This also deletes its items. This cannot be undone.</AlertDialog.Description
												>
											</AlertDialog.Header>
											<AlertDialog.Footer>
												<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
												<AlertDialog.Action onclick={() => purgeList(list.id)}
													>Delete</AlertDialog.Action
												>
											</AlertDialog.Footer>
										</AlertDialog.Content>
									</AlertDialog.Root>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Tabs.Content>

		<Tabs.Content value="items" class="pt-4">
			{#if items.length === 0}
				<p class="text-muted-foreground">No trashed items.</p>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Title</Table.Head>
							<Table.Head>List</Table.Head>
							<Table.Head>Purges in</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each items as item (item.id)}
							<Table.Row>
								<Table.Cell>{item.title}</Table.Cell>
								<Table.Cell class="text-muted-foreground">{item.listName ?? '—'}</Table.Cell>
								<Table.Cell>{daysUntilPurge(item.deletedAt)} days</Table.Cell>
								<Table.Cell class="flex justify-end gap-2">
									<Button
										variant="outline"
										size="sm"
										onclick={() => restoreItem(item.id)}
										class="gap-1.5"
									>
										<RotateCcwIcon class="size-4" />
										Restore
									</Button>
									<AlertDialog.Root>
										<AlertDialog.Trigger>
											{#snippet child({ props })}
												<Button {...props} variant="destructive" size="sm">Delete</Button>
											{/snippet}
										</AlertDialog.Trigger>
										<AlertDialog.Content>
											<AlertDialog.Header>
												<AlertDialog.Title>Permanently delete "{item.title}"?</AlertDialog.Title>
												<AlertDialog.Description>This cannot be undone.</AlertDialog.Description>
											</AlertDialog.Header>
											<AlertDialog.Footer>
												<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
												<AlertDialog.Action onclick={() => purgeItem(item.id)}
													>Delete</AlertDialog.Action
												>
											</AlertDialog.Footer>
										</AlertDialog.Content>
									</AlertDialog.Root>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Tabs.Content>

		<Tabs.Content value="activities" class="pt-4">
			{#if activities.length === 0}
				<p class="text-muted-foreground">No trashed activities.</p>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Name</Table.Head>
							<Table.Head>Purges in</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each activities as activity (activity.id)}
							<Table.Row>
								<Table.Cell>{activity.name}</Table.Cell>
								<Table.Cell>{daysUntilPurge(activity.deletedAt)} days</Table.Cell>
								<Table.Cell class="flex justify-end gap-2">
									<Button
										variant="outline"
										size="sm"
										onclick={() => restoreActivity(activity.id)}
										class="gap-1.5"
									>
										<RotateCcwIcon class="size-4" />
										Restore
									</Button>
									<AlertDialog.Root>
										<AlertDialog.Trigger>
											{#snippet child({ props })}
												<Button {...props} variant="destructive" size="sm">Delete</Button>
											{/snippet}
										</AlertDialog.Trigger>
										<AlertDialog.Content>
											<AlertDialog.Header>
												<AlertDialog.Title>Permanently delete "{activity.name}"?</AlertDialog.Title>
												<AlertDialog.Description>This cannot be undone.</AlertDialog.Description>
											</AlertDialog.Header>
											<AlertDialog.Footer>
												<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
												<AlertDialog.Action onclick={() => purgeActivity(activity.id)}
													>Delete</AlertDialog.Action
												>
											</AlertDialog.Footer>
										</AlertDialog.Content>
									</AlertDialog.Root>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Tabs.Content>

		<Tabs.Content value="users" class="pt-4">
			{#if users.length === 0}
				<p class="text-muted-foreground">No trashed users.</p>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Name</Table.Head>
							<Table.Head>Purges in</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each users as user (user.id)}
							<Table.Row>
								<Table.Cell>{user.name}</Table.Cell>
								<Table.Cell>{daysUntilPurge(user.deletedAt)} days</Table.Cell>
								<Table.Cell class="flex justify-end gap-2">
									<Button
										variant="outline"
										size="sm"
										onclick={() => restoreUser(user.id)}
										class="gap-1.5"
									>
										<RotateCcwIcon class="size-4" />
										Restore
									</Button>
									<AlertDialog.Root>
										<AlertDialog.Trigger>
											{#snippet child({ props })}
												<Button {...props} variant="destructive" size="sm">Delete</Button>
											{/snippet}
										</AlertDialog.Trigger>
										<AlertDialog.Content>
											<AlertDialog.Header>
												<AlertDialog.Title>Permanently delete "{user.name}"?</AlertDialog.Title>
												<AlertDialog.Description>This cannot be undone.</AlertDialog.Description>
											</AlertDialog.Header>
											<AlertDialog.Footer>
												<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
												<AlertDialog.Action onclick={() => purgeUser(user.id)}
													>Delete</AlertDialog.Action
												>
											</AlertDialog.Footer>
										</AlertDialog.Content>
									</AlertDialog.Root>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Tabs.Content>

		<Tabs.Content value="media" class="pt-4">
			{#if media.length === 0}
				<p class="text-muted-foreground">No trashed media.</p>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>File</Table.Head>
							<Table.Head>Kind</Table.Head>
							<Table.Head>Purges in</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each media as asset (asset.id)}
							<Table.Row>
								<Table.Cell>{asset.fileName ?? asset.url ?? asset.id}</Table.Cell>
								<Table.Cell class="text-muted-foreground">{asset.kind}</Table.Cell>
								<Table.Cell>{daysUntilPurge(asset.deletedAt)} days</Table.Cell>
								<Table.Cell class="flex justify-end gap-2">
									<Button
										variant="outline"
										size="sm"
										onclick={() => restoreAsset(asset.id)}
										class="gap-1.5"
									>
										<RotateCcwIcon class="size-4" />
										Restore
									</Button>
									<AlertDialog.Root>
										<AlertDialog.Trigger>
											{#snippet child({ props })}
												<Button {...props} variant="destructive" size="sm">Delete</Button>
											{/snippet}
										</AlertDialog.Trigger>
										<AlertDialog.Content>
											<AlertDialog.Header>
												<AlertDialog.Title>Permanently delete this file?</AlertDialog.Title>
												<AlertDialog.Description>This cannot be undone.</AlertDialog.Description>
											</AlertDialog.Header>
											<AlertDialog.Footer>
												<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
												<AlertDialog.Action onclick={() => purgeAsset(asset.id)}
													>Delete</AlertDialog.Action
												>
											</AlertDialog.Footer>
										</AlertDialog.Content>
									</AlertDialog.Root>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Tabs.Content>
	</Tabs.Root>
</div>
