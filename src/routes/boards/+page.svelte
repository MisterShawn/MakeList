<script lang="ts">
	import { onMount } from 'svelte';
	import { getBoards, createBoard, softDeleteBoard, getLists } from '$lib/db/queries';
	import type { Board, List, BoardType } from '$lib/db/schema';
	import ResponsiveDialog from '$lib/components/ResponsiveDialog.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Plus, MoreHorizontal, Pencil, Trash2, Play,
		Layers, CheckSquare, Shuffle, Brain, HelpCircle, LayoutGrid
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import PageHeader from '$lib/components/PageHeader.svelte';

	// ── Board type meta ────────────────────────────────────────────────────────

	const BOARD_TYPES: { value: BoardType; label: string; icon: typeof Layers }[] = [
		{ value: 'flashcard',        label: 'Flashcard',       icon: Layers },
		{ value: 'multiple-choice',  label: 'Multiple Choice', icon: CheckSquare },
		{ value: 'matching',         label: 'Matching',        icon: Shuffle },
		{ value: 'memory',           label: 'Memory',          icon: Brain },
		{ value: 'quiz',             label: 'Quiz',            icon: HelpCircle },
		{ value: 'choice-board',     label: 'Choice Board',    icon: LayoutGrid },
	];

	function boardTypeMeta(type: BoardType) {
		return BOARD_TYPES.find((t) => t.value === type) ?? BOARD_TYPES[0];
	}

	// ── State ──────────────────────────────────────────────────────────────────

	let boards = $state<Board[]>([]);
	let lists = $state<List[]>([]);
	let loading = $state(true);

	// Dialog
	let dialogOpen = $state(false);
	let formName = $state('');
	let formType = $state<BoardType>('flashcard');
	let formListId = $state<number | ''>('');
	let formList2Id = $state<number | ''>('');
	let saving = $state(false);

	// ── Derived ────────────────────────────────────────────────────────────────

	const listMap = $derived(
		Object.fromEntries(lists.map((l) => [l.id!, l.name]))
	);

	const canSave = $derived(formName.trim().length > 0 && formListId !== '');

	// ── Data loading ───────────────────────────────────────────────────────────

	onMount(async () => {
		[boards, lists] = await Promise.all([getBoards(), getLists()]);
		loading = false;
	});

	async function load() {
		boards = await getBoards();
	}

	// ── Dialog ─────────────────────────────────────────────────────────────────

	function openCreate() {
		formName = '';
		formType = 'flashcard';
		formListId = lists[0]?.id ?? '';
		formList2Id = '';
		dialogOpen = true;
	}

	async function handleSave() {
		if (!canSave || saving || formListId === '') return;
		saving = true;
		try {
			const id = await createBoard({
				name: formName.trim(),
				type: formType,
				listId: formListId as number,
				list2Id: formType === 'choice-board' && formList2Id !== '' ? (formList2Id as number) : undefined,
				settings: {},
				tagIds: []
			});
			dialogOpen = false;
			await load();
			// Navigate to edit page to configure settings
			window.location.href = `/boards/${id}/edit`;
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

	// ── Delete ─────────────────────────────────────────────────────────────────

	function handleDelete(board: Board, e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		boards = boards.filter((b) => b.id !== board.id);

		let tid: ReturnType<typeof setTimeout>;
		toast(`"${board.name}" moved to trash`, {
			duration: 5000,
			action: {
				label: 'Undo',
				onClick: () => {
					clearTimeout(tid);
					boards = [...boards, board].sort((a, b) => a.name.localeCompare(b.name));
				},
			},
		});
		tid = setTimeout(() => softDeleteBoard(board.id!), 5000);
	}
</script>

<svelte:head><title>Boards — MakeList</title></svelte:head>

<div class="flex h-full flex-col">
	<PageHeader crumbs={[{ label: 'Boards' }]}>
		{#snippet actions()}
			<Button size="sm" onclick={openCreate} disabled={lists.length === 0}>
				<Plus size={14} />
				New board
			</Button>
		{/snippet}
	</PageHeader>

	<!-- ── Content ───────────────────────────────────────────────────────────── -->
	<div class="flex-1 overflow-y-auto p-6">
		{#if loading}
			<p class="text-sm text-muted-foreground">Loading…</p>
		{:else if boards.length === 0}
			<div class="flex flex-col items-center gap-3 pt-16 text-center">
				<Layers size={32} class="text-muted-foreground/40" />
				{#if lists.length === 0}
					<p class="text-sm text-muted-foreground">Create a list first, then come back to build a board.</p>
					<Button href="/lists">Go to Lists</Button>
				{:else}
					<p class="text-sm text-muted-foreground">No boards yet. Create your first one.</p>
					<Button onclick={openCreate}>
						<Plus size={15} />
						New board
					</Button>
				{/if}
			</div>
		{:else}
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each boards as board (board.id)}
					{@const meta = boardTypeMeta(board.type)}
					{@const BoardIcon = meta.icon}
					<div
						class="group relative flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-sm"
					>
						<!-- Play link covers the card -->
						<a
							href="/boards/{board.id}"
							class="absolute inset-0 rounded-lg"
							aria-label={board.name}
						></a>

						<div class="flex items-start justify-between gap-2">
							<div class="flex min-w-0 flex-col gap-1">
								<!-- Type badge -->
								<span class="inline-flex w-fit items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
									<BoardIcon size={11} />
									{meta.label}
								</span>
								<h2 class="line-clamp-2 font-medium leading-snug">{board.name}</h2>
							</div>

							<!-- Actions -->
							<div class="relative z-10 shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										<Button variant="ghost" size="icon" class="h-7 w-7" aria-label="Board actions">
											<MoreHorizontal size={15} />
										</Button>
									</DropdownMenu.Trigger>
									<DropdownMenu.Content align="end" class="w-40">
										<DropdownMenu.Item onclick={() => { window.location.href = `/boards/${board.id}`; }}>
											<Play size={13} class="mr-2" />
											Play
										</DropdownMenu.Item>
										<DropdownMenu.Item onclick={() => { window.location.href = `/boards/${board.id}/edit`; }}>
											<Pencil size={13} class="mr-2" />
											Edit
										</DropdownMenu.Item>
										<DropdownMenu.Separator />
										<DropdownMenu.Item
											onclick={(e) => handleDelete(board, e)}
											class="text-destructive focus:text-destructive"
										>
											<Trash2 size={13} class="mr-2" />
											Delete
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</div>
						</div>

						<!-- List name -->
						<p class="mt-auto text-xs text-muted-foreground">
							{listMap[board.listId] ?? 'Unknown list'}
						</p>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- ── Create dialog ─────────────────────────────────────────────────────── -->
<ResponsiveDialog
	bind:open={dialogOpen}
	title="New board"
	description="Choose a type and list, then configure settings on the next screen."
	class="max-w-sm"
>
	{#snippet children()}
		<div class="flex flex-col gap-4 py-2">
			<!-- Name -->
			<div class="flex flex-col gap-1.5">
				<Label for="board-name">Name</Label>
				<Input
					id="board-name"
					type="text"
					placeholder="e.g. Spanish vocab flashcards"
					bind:value={formName}
					onkeydown={handleFormKeydown}
				/>
			</div>

			<!-- Type -->
			<div class="flex flex-col gap-2">
				<Label>Type</Label>
				<div class="grid grid-cols-3 gap-2">
					{#each BOARD_TYPES as bt}
						{@const BtIcon = bt.icon}
						<button
							type="button"
							onclick={() => (formType = bt.value)}
							class="flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-center text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring {formType === bt.value ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-muted-foreground hover:border-border/80 hover:text-foreground'}"
						>
							<BtIcon size={16} />
							{bt.label}
						</button>
					{/each}
				</div>
			</div>

			<!-- Primary list -->
			<div class="flex flex-col gap-1.5">
				<Label for="board-list">List</Label>
				<select
					id="board-list"
					bind:value={formListId}
					class="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
				>
					<option value="">Select a list…</option>
					{#each lists as list}
						<option value={list.id}>{list.name}</option>
					{/each}
				</select>
			</div>

			<!-- Secondary list (choice-board only) -->
			{#if formType === 'choice-board'}
				<div class="flex flex-col gap-1.5">
					<Label for="board-list2">
						Secondary list
						<span class="font-normal text-muted-foreground">(optional)</span>
					</Label>
					<select
						id="board-list2"
						bind:value={formList2Id}
						class="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
					>
						<option value="">None</option>
						{#each lists as list}
							<option value={list.id}>{list.name}</option>
						{/each}
					</select>
				</div>
			{/if}
		</div>
	{/snippet}
	{#snippet footer()}
		<Button variant="outline" onclick={() => (dialogOpen = false)}>Cancel</Button>
		<Button onclick={handleSave} disabled={!canSave || saving}>
			{saving ? 'Creating…' : 'Create & configure'}
		</Button>
	{/snippet}
</ResponsiveDialog>
