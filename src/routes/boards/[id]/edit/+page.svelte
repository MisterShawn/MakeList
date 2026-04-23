<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getBoard, updateBoard, getLists } from '$lib/db/queries';
	import type { Board, List, BoardType } from '$lib/db/schema';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Layers, CheckSquare, Shuffle, Brain, HelpCircle, LayoutGrid } from 'lucide-svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { Switch } from '$lib/components/ui/switch';
	import { Slider } from '$lib/components/ui/slider';

	// ── Board type meta ────────────────────────────────────────────────────────

	const BOARD_TYPES: { value: BoardType; label: string; icon: typeof Layers; description: string }[] = [
		{ value: 'flashcard',       label: 'Flashcard',       icon: Layers,      description: 'Flip cards to reveal the answer.' },
		{ value: 'multiple-choice', label: 'Multiple Choice', icon: CheckSquare, description: 'Pick the correct answer from options.' },
		{ value: 'matching',        label: 'Matching',        icon: Shuffle,     description: 'Match pairs by connecting them.' },
		{ value: 'memory',          label: 'Memory',          icon: Brain,       description: 'Find matching card pairs face-down.' },
		{ value: 'quiz',            label: 'Quiz',            icon: HelpCircle,  description: 'Answer questions in sequence.' },
		{ value: 'choice-board',    label: 'Choice Board',    icon: LayoutGrid,  description: 'Tap items from a grid of choices.' },
	];

	// ── State ──────────────────────────────────────────────────────────────────

	let board = $state<Board | null>(null);
	let lists = $state<List[]>([]);
	let loading = $state(true);
	let notFound = $state(false);
	let saving = $state(false);

	// Form fields
	let formName = $state('');
	let formType = $state<BoardType>('flashcard');
	let formListId = $state<number | ''>('');
	let formList2Id = $state<number | ''>('');
	let formAutoAdvance = $state(false);
	let formAutoAdvanceDelay = $state(1500);
	let formHideMatched = $state(false);

	// ── Load ───────────────────────────────────────────────────────────────────

	onMount(async () => {
		const id = parseInt(page.params.id ?? '');
		const [fetched, fetchedLists] = await Promise.all([getBoard(id), getLists()]);
		lists = fetchedLists;
		board = fetched ?? null;
		if (!board) {
			notFound = true;
			loading = false;
			return;
		}
		formName             = board.name;
		formType             = board.type;
		formListId           = board.listId;
		formList2Id          = board.list2Id ?? '';
		formAutoAdvance      = (board.settings?.autoAdvance as boolean) ?? false;
		formAutoAdvanceDelay = (board.settings?.autoAdvanceDelay as number) ?? 1500;
		formHideMatched      = (board.settings?.hideMatched as boolean) ?? false;
		loading = false;
	});

	// ── Derived ────────────────────────────────────────────────────────────────

	const canSave = $derived(formName.trim().length > 0 && formListId !== '');

	// ── Save ───────────────────────────────────────────────────────────────────

	async function handleSave() {
		if (!canSave || saving || !board) return;
		saving = true;
		try {
			await updateBoard(board.id!, {
				name: formName.trim(),
				type: formType,
				listId: formListId as number,
				list2Id: formType === 'choice-board' && formList2Id !== '' ? (formList2Id as number) : undefined,
				settings: { autoAdvance: formAutoAdvance, autoAdvanceDelay: formAutoAdvanceDelay, hideMatched: formHideMatched },
			});
			goto(`/boards/${board.id}`);
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head><title>Edit Board — MakeList</title></svelte:head>

<div class="flex h-full flex-col">
	<PageHeader crumbs={[{ label: 'Boards', href: '/boards' }, { label: 'Edit board' }]} />

	<!-- ── Body ──────────────────────────────────────────────────────────────── -->
	<div class="flex-1 overflow-y-auto p-6">
		{#if loading}
			<p class="text-sm text-muted-foreground">Loading…</p>
		{:else if notFound}
			<p class="text-sm text-muted-foreground">Board not found.</p>
		{:else}
			<div class="mx-auto flex max-w-lg flex-col gap-6">

				<!-- Name -->
				<div class="flex flex-col gap-1.5">
					<Label for="board-name">Name</Label>
					<Input
						id="board-name"
						type="text"
						placeholder="Board name"
						bind:value={formName}
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
								class="flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-center text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring {formType === bt.value ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-muted-foreground hover:border-border/80 hover:text-foreground'}"
							>
								<BtIcon size={18} />
								{bt.label}
							</button>
						{/each}
					</div>
					{#each BOARD_TYPES as bt}
						{#if formType === bt.value}
							<p class="text-xs text-muted-foreground">{bt.description}</p>
						{/if}
					{/each}
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

				<!-- Settings -->
				<div class="flex flex-col gap-4 rounded-lg border border-border p-4">
					<p class="text-sm font-medium">Settings</p>

					<div class="flex items-center justify-between gap-3">
						<Label for="auto-advance" class="cursor-pointer font-normal">Auto-advance to next card</Label>
						<Switch id="auto-advance" bind:checked={formAutoAdvance} />
					</div>

					{#if formAutoAdvance}
						<div class="flex flex-col gap-3 px-3">
							<div class="flex items-center justify-between">
								<Label class="text-xs font-normal text-muted-foreground">Delay</Label>
								<span class="text-xs text-muted-foreground">{formAutoAdvanceDelay / 1000}s</span>
							</div>
							<Slider
								type="single"
								min={500}
								max={3000}
								step={500}
								bind:value={formAutoAdvanceDelay}
							/>
							<div class="flex justify-between text-xs text-muted-foreground">
								<span>0.5s</span>
								<span>3s</span>
							</div>
						</div>
					{/if}

					{#if formType === 'matching'}
						<div class="flex items-center justify-between gap-3">
							<Label for="hide-matched" class="cursor-pointer font-normal">Hide matched pairs</Label>
							<Switch id="hide-matched" bind:checked={formHideMatched} />
						</div>
					{/if}
				</div>

				<!-- Save -->
				<div class="flex justify-end gap-2 border-t border-border pt-4">
					<Button variant="outline" href="/boards/{page.params.id}">Cancel</Button>
					<Button onclick={handleSave} disabled={!canSave || saving}>
						{saving ? 'Saving…' : 'Save changes'}
					</Button>
				</div>

			</div>
		{/if}
	</div>
</div>
