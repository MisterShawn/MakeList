<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as q from '$lib/db/queries';
	import type { User } from '$lib/db/types';

	let retentionDays = $state(30);
	let currentUserId = $state<string | undefined>(undefined);
	let users = $state<User[]>([]);
	let saving = $state(false);

	async function load() {
		const settings = await q.getSettings();
		retentionDays = settings.trashRetentionDays;
		currentUserId = settings.currentUserId;
		users = await q.listActiveUsers();
	}

	onMount(load);

	async function save() {
		saving = true;
		try {
			await q.updateSettings({
				trashRetentionDays: Math.max(1, Math.round(retentionDays)),
				currentUserId
			});
			toast.success('Settings saved');
		} finally {
			saving = false;
		}
	}

	const currentUserName = $derived(users.find((u) => u.id === currentUserId)?.name ?? 'None');
</script>

<div class="max-w-md space-y-6">
	<div>
		<h1 class="text-2xl font-semibold">Settings</h1>
		<p class="text-muted-foreground">App-wide preferences.</p>
	</div>

	<Card.Root>
		<Card.Header>
			<Card.Title>Trash</Card.Title>
			<Card.Description
				>How long trashed items are kept before being permanently deleted.</Card.Description
			>
		</Card.Header>
		<Card.Content>
			<div class="space-y-1.5">
				<Label for="retention-days">Retention (days)</Label>
				<Input id="retention-days" type="number" min="1" bind:value={retentionDays} class="w-32" />
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Default user</Card.Title>
			<Card.Description>Who's assumed to be playing an activity by default.</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if users.length === 0}
				<p class="text-sm text-muted-foreground">No users yet.</p>
			{:else}
				<Select.Root
					type="single"
					value={currentUserId ?? ''}
					onValueChange={(v) => (currentUserId = v || undefined)}
				>
					<Select.Trigger class="w-full">{currentUserName}</Select.Trigger>
					<Select.Content>
						{#each users as user (user.id)}
							<Select.Item value={user.id} label={user.name} />
						{/each}
					</Select.Content>
				</Select.Root>
			{/if}
		</Card.Content>
	</Card.Root>

	<Button onclick={save} disabled={saving}>Save Settings</Button>
</div>
