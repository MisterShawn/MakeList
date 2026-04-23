<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { liveQuery } from 'dexie';
	import { Search, List, LayoutGrid, Users, Tags, Image, AlignLeft, ChevronRight, Trash2 } from 'lucide-svelte';
	import * as Command from '$lib/components/ui/command';
	import { Button } from '$lib/components/ui/button';
	import { searchAll, type SearchResult, type SearchResultType } from '$lib/db/queries';

	// ── Open state ─────────────────────────────────────────────────────────────

	let open = $state(false);
	let query = $state('');

	// ── Live search ────────────────────────────────────────────────────────────

	let results = $state<SearchResult[]>([]);

	$effect(() => {
		const q = query;
		if (!q.trim()) { results = []; return; }
		const sub = liveQuery(() => searchAll(q)).subscribe({
			next: (v) => { results = v; },
			error: (e) => console.error(e)
		});
		return () => sub.unsubscribe();
	});

	// ── Current section ────────────────────────────────────────────────────────

	const currentTypes = $derived((): SearchResultType[] => {
		const p = page.url.pathname;
		if (p.startsWith('/lists')) return ['list', 'item'];
		if (p.startsWith('/boards')) return ['board'];
		if (p.startsWith('/players')) return ['player'];
		if (p.startsWith('/tags')) return ['tag'];
		if (p.startsWith('/media')) return ['media'];
		if (p.startsWith('/trash')) return ['trash'];
		return [];
	});

	// ── Grouped results (current type first) ───────────────────────────────────

	const LABELS: Record<SearchResultType, string> = {
		list: 'Lists',
		item: 'Items',
		board: 'Boards',
		player: 'Players',
		tag: 'Tags',
		media: 'Media',
		trash: 'Trash',
	};

	const ICONS: Record<SearchResultType, typeof List> = {
		list: List,
		item: AlignLeft,
		board: LayoutGrid,
		player: Users,
		tag: Tags,
		media: Image,
		trash: Trash2,
	};

	const TYPE_ORDER: SearchResultType[] = ['list', 'item', 'board', 'player', 'tag', 'media', 'trash'];

	const grouped = $derived((): { type: SearchResultType; label: string; items: SearchResult[] }[] => {
		if (!results.length) return [];

		const byType = new Map<SearchResultType, SearchResult[]>();
		for (const r of results) {
			if (!byType.has(r.type)) byType.set(r.type, []);
			byType.get(r.type)!.push(r);
		}

		// Order: current page types first, then the rest in default order
		const current = currentTypes();
		const order = current.length
			? [...current, ...TYPE_ORDER.filter((t) => !current.includes(t))]
			: TYPE_ORDER;

		return order
			.filter((t) => byType.has(t))
			.map((t) => ({ type: t, label: LABELS[t], items: byType.get(t)! }));
	});

	// ── Navigation ─────────────────────────────────────────────────────────────

	function select(href: string) {
		open = false;
		query = '';
		goto(href);
	}

	// ── Keyboard shortcut ──────────────────────────────────────────────────────

	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			open = true;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<Button
	variant="outline"
	onclick={() => (open = true)}
	class="h-8 justify-start gap-2 border-input bg-muted/40 px-3 text-sm font-normal text-muted-foreground hover:bg-muted hover:text-muted-foreground sm:w-48 xl:w-64"
>
	<Search size={13} class="shrink-0" />
	<span class="hidden flex-1 text-left sm:inline">Search…</span>
	<kbd class="hidden rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px] leading-none sm:inline">⌘K</kbd>
</Button>

<Command.Dialog
	bind:open
	shouldFilter={false}
	title="Search"
	description="Search across all your content"
	class="w-[calc(100%-2rem)] max-w-lg"
>
	<Command.Input
		bind:value={query}
		placeholder="Search lists, items, boards, players, tags, media…"
		class="h-11"
	/>
	<Command.List class="max-h-[360px]">
		{#if query.trim() && results.length === 0}
			<Command.Empty>No results for "{query}"</Command.Empty>
		{:else if !query.trim()}
			<Command.Empty class="py-6 text-center text-sm text-muted-foreground">
				Start typing to search…
			</Command.Empty>
		{:else}
			{#each grouped() as group (group.type)}
				<Command.Group heading={group.label}>
					{#each group.items as item (item.id)}
						{@const Icon = ICONS[item.type]}
						<Command.Item
							value="{item.type}-{item.id}"
							onSelect={() => select(item.href)}
						>
							<Icon size={14} class="shrink-0 text-muted-foreground" />
							{#if item.breadcrumb}
								<span class="flex items-center gap-1 text-muted-foreground">
									{item.breadcrumb}
									<ChevronRight size={11} class="shrink-0" />
								</span>
							{/if}
							<span>{item.name}</span>
						</Command.Item>
					{/each}
				</Command.Group>
			{/each}
		{/if}
	</Command.List>
</Command.Dialog>
