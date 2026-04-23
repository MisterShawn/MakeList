<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { getTag, getContentByTag } from '$lib/db/queries';
	import type { Tag, List, Item, Board } from '$lib/db/schema';
	import { List as ListIcon, Tag as TagIcon, LayoutGrid } from 'lucide-svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';

	const tagId = Number(page.params.id);

	let tag = $state<Tag | undefined>(undefined);
	let lists = $state<List[]>([]);
	let items = $state<Item[]>([]);
	let itemListMap = $state<Map<number, List>>(new Map());
	let boards = $state<Board[]>([]);
	let loading = $state(true);
	let notFound = $state(false);

	onMount(async () => {
		const [t, content] = await Promise.all([getTag(tagId), getContentByTag(tagId)]);
		if (!t || t.deletedAt) {
			notFound = true;
		} else {
			tag = t;
			lists = content.lists;
			items = content.items;
			itemListMap = content.itemListMap;
			boards = content.boards;
		}
		loading = false;
	});
</script>

<svelte:head>
	<title>{tag?.name ?? 'Tag'} — MakeList</title>
</svelte:head>

{#if loading}
	<p class="p-6 text-sm text-muted-foreground">Loading…</p>
{:else if notFound}
	<div class="flex flex-col items-center gap-3 p-12 text-center">
		<p class="text-muted-foreground">Tag not found.</p>
		<a href="/tags" class="text-sm text-primary underline-offset-4 hover:underline">← Back to tags</a>
	</div>
{:else if tag}
	<div class="flex h-full flex-col">
		<PageHeader crumbs={[{ label: 'Tags', href: '/tags' }, { label: tag.name }]} />

		<!-- ── Tag pill ────────────────────────────────────────────────────────── -->
		<div class="border-b border-border px-6 py-5 text-center">
			<span
				class="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium text-white"
				style="background-color: {tag.color}"
			>
				{tag.name}
			</span>
		</div>

		<!-- ── Content ─────────────────────────────────────────────────────────── -->
		<div class="flex-1 overflow-y-auto">
			{#if lists.length === 0 && items.length === 0 && boards.length === 0}
				<div class="flex flex-col items-center gap-3 p-12 text-center">
					<TagIcon size={32} class="text-muted-foreground/40" />
					<p class="text-sm text-muted-foreground">No content is using this tag yet.</p>
				</div>
			{:else}
				<div class="divide-y divide-border">
					<!-- Lists -->
					{#if lists.length > 0}
						<section class="px-6 py-4">
							<h2 class="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
								<ListIcon size={13} />
								Lists
							</h2>
							<div class="flex flex-col gap-1">
								{#each lists as list (list.id)}
									<a
										href="/lists/{list.id}"
										class="flex items-center rounded-md px-2 py-2 text-sm hover:bg-accent/50 transition-colors"
									>
										{list.name}
										{#if list.description}
											<span class="ml-2 truncate text-xs text-muted-foreground">{list.description}</span>
										{/if}
									</a>
								{/each}
							</div>
						</section>
					{/if}

					<!-- Items -->
					{#if items.length > 0}
						<section class="px-6 py-4">
							<h2 class="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
								<ListIcon size={13} />
								Items
							</h2>
							<div class="flex flex-col gap-1">
								{#each items as item (item.id)}
									{@const parentList = itemListMap.get(item.listId)}
									<a
										href="/lists/{item.listId}"
										class="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-accent/50 transition-colors"
									>
										<span>{item.text}</span>
										{#if parentList}
											<span class="ml-4 shrink-0 text-xs text-muted-foreground">{parentList.name}</span>
										{/if}
									</a>
								{/each}
							</div>
						</section>
					{/if}

					<!-- Boards -->
					{#if boards.length > 0}
						<section class="px-6 py-4">
							<h2 class="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
								<LayoutGrid size={13} />
								Boards
							</h2>
							<div class="flex flex-col gap-1">
								{#each boards as board (board.id)}
									<a
										href="/boards/{board.id}"
										class="flex items-center rounded-md px-2 py-2 text-sm hover:bg-accent/50 transition-colors"
									>
										{board.name}
									</a>
								{/each}
							</div>
						</section>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}
