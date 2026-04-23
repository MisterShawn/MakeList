<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { getPlayer, updatePlayer, softDeletePlayer } from '$lib/db/queries';
	import type { Player } from '$lib/db/schema';
	import EmojiPicker from '$lib/components/EmojiPicker.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Pencil, Trash2 } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	const id = Number(page.params.id);

	let player = $state<Player | null>(null);
	let loading = $state(true);
	let editing = $state(false);
	let editName = $state('');
	let editEmojiHex = $state<string | undefined>(undefined);
	let savedEmojiHex = $state<string | undefined>(undefined);

	onMount(async () => {
		player = (await getPlayer(id)) ?? null;
		if (player) {
			editName = player.name;
			editEmojiHex = player.avatarEmoji ?? undefined;
			savedEmojiHex = editEmojiHex;
		}
		loading = false;
	});

	// Auto-save emoji immediately when picker selection changes
	$effect(() => {
		const hex = editEmojiHex;
		if (!editing || hex === savedEmojiHex || !player) return;
		savedEmojiHex = hex;
		updatePlayer(player.id!, { avatarEmoji: hex }).then(() => {
			if (player) player = { ...player!, avatarEmoji: hex };
		});
	});

	async function saveName() {
		if (!player || !editName.trim()) return;
		const name = editName.trim();
		if (name === player.name) return;
		await updatePlayer(player.id!, { name });
		player = { ...player, name };
	}

	function handleNameKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
	}

	function handleDelete() {
		if (!player) return;
		const p = player;
		goto('/players');
		let tid: ReturnType<typeof setTimeout>;
		toast(`"${p.name}" moved to trash`, {
			duration: 5000,
			action: {
				label: 'Undo',
				onClick: () => clearTimeout(tid),
			},
		});
		tid = setTimeout(() => softDeletePlayer(p.id!), 5000);
	}
</script>

<svelte:head><title>{player?.name ?? 'Player'} — MakeList</title></svelte:head>

{#if loading}
	<p class="p-6 text-sm text-muted-foreground">Loading…</p>
{:else if !player}
	<div class="flex flex-col items-center gap-3 p-12 text-center">
		<p class="text-muted-foreground">Player not found.</p>
		<a href="/players" class="text-sm text-primary underline-offset-4 hover:underline">← Back to players</a>
	</div>
{:else}
	<div class="flex h-full flex-col">
		<PageHeader crumbs={[{ label: 'Players', href: '/players' }, { label: player!.name }]}>
			{#snippet actions()}
				{#if editing && !player!.isSystem}
					<Button variant="ghost" size="sm" class="text-destructive hover:text-destructive" onclick={handleDelete}>
						<Trash2 size={13} />
						Delete
					</Button>
					<Button variant="secondary" size="sm" onclick={() => (editing = false)}>
						<Pencil size={13} />
						Done
					</Button>
				{:else}
					<Button variant="outline" size="sm" onclick={() => (editing = true)} disabled={player!.isSystem}>
						<Pencil size={13} />
						Edit
					</Button>
				{/if}
			{/snippet}
		</PageHeader>

		<!-- ── Player identity ────────────────────────────────────────────────── -->
		<div class="border-b border-border px-6 py-5">
			{#if editing}
				<div class="flex flex-col items-center gap-4">
					<EmojiPicker bind:value={editEmojiHex} />
					<Input
						type="text"
						bind:value={editName}
						onblur={saveName}
						onkeydown={handleNameKeydown}
						style="field-sizing: content"
						class="w-auto max-w-full text-center text-xl font-semibold border-dashed"
					/>
				</div>
			{:else}
				<div class="flex flex-col items-center gap-3">
					{#if player.avatarEmoji}
						<img src="/openmoji/{player.avatarEmoji}.svg" alt="" class="h-16 w-16 select-none" draggable="false" />
					{/if}
					<p class="text-xl font-semibold">{player.name}</p>
				</div>
			{/if}
		</div>

		<!-- ── Content (future) ───────────────────────────────────────────────── -->
		<div class="flex-1 overflow-y-auto p-6"></div>
	</div>
{/if}
