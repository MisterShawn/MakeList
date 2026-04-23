<script lang="ts">
	import { onMount } from 'svelte';
	import { getLists } from '$lib/db/queries';
	import { getBoards } from '$lib/db/queries';
	import { getPlayers } from '$lib/db/queries';
	import type { List, Board, Player } from '$lib/db/schema';
	import { Button } from '$lib/components/ui/button';
	import { List as ListIcon, LayoutGrid, Users, Plus } from 'lucide-svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';

	let lists = $state<List[]>([]);
	let boards = $state<Board[]>([]);
	let players = $state<Player[]>([]);
	let loading = $state(true);

	onMount(async () => {
		[lists, boards, players] = await Promise.all([getLists(), getBoards(), getPlayers()]);
		loading = false;
	});
</script>

<svelte:head>
	<title>MakeList</title>
</svelte:head>

<div class="flex h-full flex-col">
	<PageHeader crumbs={[{ label: 'Home' }]} />

	<div class="flex-1 overflow-y-auto p-6">
	{#if loading}
		<p class="text-muted-foreground text-sm">Loading…</p>
	{:else}
		<div class="grid gap-4 sm:grid-cols-3">
			<!-- Lists card -->
			<a
				href="/lists"
				class="group flex flex-col gap-3 rounded-lg border border-border bg-card p-5 transition-colors hover:bg-accent"
			>
				<div class="flex items-center justify-between">
					<ListIcon size={20} class="text-muted-foreground" />
					<span class="text-2xl font-semibold">{lists.length}</span>
				</div>
				<div>
					<p class="font-medium">Lists</p>
					<p class="text-muted-foreground text-sm">{lists.length === 1 ? '1 list' : `${lists.length} lists`}</p>
				</div>
			</a>

			<!-- Boards card -->
			<a
				href="/boards"
				class="group flex flex-col gap-3 rounded-lg border border-border bg-card p-5 transition-colors hover:bg-accent"
			>
				<div class="flex items-center justify-between">
					<LayoutGrid size={20} class="text-muted-foreground" />
					<span class="text-2xl font-semibold">{boards.length}</span>
				</div>
				<div>
					<p class="font-medium">Boards</p>
					<p class="text-muted-foreground text-sm">{boards.length === 1 ? '1 board' : `${boards.length} boards`}</p>
				</div>
			</a>

			<!-- Players card -->
			<a
				href="/players"
				class="group flex flex-col gap-3 rounded-lg border border-border bg-card p-5 transition-colors hover:bg-accent"
			>
				<div class="flex items-center justify-between">
					<Users size={20} class="text-muted-foreground" />
					<span class="text-2xl font-semibold">{players.length}</span>
				</div>
				<div>
					<p class="font-medium">Players</p>
					<p class="text-muted-foreground text-sm">{players.length === 1 ? '1 player' : `${players.length} players`}</p>
				</div>
			</a>
		</div>

		{#if lists.length === 0 && boards.length === 0}
			<div class="mt-12 flex flex-col items-center gap-4 text-center">
				<p class="text-muted-foreground max-w-sm text-sm">
					Get started by creating your first list. Add items, then build a board to quiz yourself.
				</p>
				<Button href="/lists">
					<Plus size={16} />
					New list
				</Button>
			</div>
		{/if}
	{/if}
	</div>
</div>
