<script lang="ts">
	import { onMount } from 'svelte';
	import { getPlayers, createPlayer } from '$lib/db/queries';
	import type { Player } from '$lib/db/schema';
	import ResponsiveDialog from '$lib/components/ResponsiveDialog.svelte';
	import EmojiPicker from '$lib/components/EmojiPicker.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Plus, Users } from 'lucide-svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';

	/** Return the OpenMoji SVG path for a hex code. */
	function emojiSrc(hex: string): string {
		return `/openmoji/${hex.toUpperCase()}.svg`;
	}

	// ── State ──────────────────────────────────────────────────────────────────

	let players = $state<Player[]>([]);
	let loading = $state(true);

	// Create dialog
	let dialogOpen = $state(false);
	let formName = $state('');
	let formEmojiHex = $state<string | undefined>(undefined);
	let saving = $state(false);

	const canSave = $derived(formName.trim().length > 0);

	// ── Data loading ───────────────────────────────────────────────────────────

	onMount(async () => {
		players = await getPlayers();
		loading = false;
	});

	// ── Create player ──────────────────────────────────────────────────────────

	function openCreate() {
		formName = '';
		formEmojiHex = undefined;
		dialogOpen = true;
	}

	async function handleSave() {
		if (!canSave || saving) return;
		saving = true;
		try {
			const id = await createPlayer({
				name: formName.trim(),
				avatarEmoji: formEmojiHex,
				tagIds: [],
			});
			players = [...players, {
				id,
				name: formName.trim(),
				avatarEmoji: formEmojiHex,
				tagIds: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			}];
			dialogOpen = false;
		} finally {
			saving = false;
		}
	}

	function handleFormKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSave();
		}
	}
</script>

<svelte:head><title>Players — MakeList</title></svelte:head>

<div class="flex h-full flex-col">
	<PageHeader crumbs={[{ label: 'Players' }]}>
		{#snippet actions()}
			<Button size="sm" onclick={openCreate}>
				<Plus size={14} />
				New player
			</Button>
		{/snippet}
	</PageHeader>

	<!-- ── Content ───────────────────────────────────────────────────────────── -->
	<div class="flex-1 overflow-y-auto p-6">
		{#if loading}
			<p class="text-sm text-muted-foreground">Loading…</p>
		{:else if players.length === 0}
			<div class="flex flex-col items-center gap-3 pt-16 text-center">
				<Users size={32} class="text-muted-foreground/40" />
				<p class="text-sm text-muted-foreground">No players yet. Create your first one.</p>
				<Button onclick={openCreate}>
					<Plus size={15} />
					New player
				</Button>
			</div>
		{:else}
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each players as player (player.id)}
					<a href="/players/{player.id}" class="block">
						<Card.Root class="flex-row items-center gap-3 px-4 py-3 transition-shadow hover:shadow-md">
							<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
								{#if player.avatarEmoji}
									<img src={emojiSrc(player.avatarEmoji)} alt="" class="h-7 w-7" />
								{:else}
									<Users size={18} class="text-muted-foreground" />
								{/if}
							</div>
							<span class="min-w-0 flex-1 truncate font-medium">{player.name}</span>
						</Card.Root>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- ── Create player dialog ───────────────────────────────────────────────── -->
<ResponsiveDialog bind:open={dialogOpen} title="New player" class="sm:max-w-md">
	{#snippet children()}
		<Card.Root>
			<Card.Content class="flex flex-col items-center gap-4 py-4">
				<EmojiPicker bind:value={formEmojiHex} />
				<Input
					type="text"
					placeholder="Player name"
					bind:value={formName}
					onkeydown={handleFormKeydown}
					class="text-center text-xl font-medium"
				/>
			</Card.Content>
		</Card.Root>
	{/snippet}
	{#snippet footer()}
		<Button variant="outline" onclick={() => (dialogOpen = false)}>Cancel</Button>
		<Button onclick={handleSave} disabled={!canSave || saving}>
			{saving ? 'Saving…' : 'Create'}
		</Button>
	{/snippet}
</ResponsiveDialog>
